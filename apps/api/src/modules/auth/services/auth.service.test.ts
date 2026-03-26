import assert from 'node:assert/strict';
import test from 'node:test';

process.env.NODE_ENV ??= 'test';
process.env.APP_ORIGIN ??= 'http://localhost:3000';
process.env.SESSION_SECRET ??= '1234567890abcdef';
process.env.POSTGRES_HOST ??= 'localhost';
process.env.POSTGRES_PORT ??= '5432';
process.env.POSTGRES_DB ??= 'tracking_okrs_test';
process.env.POSTGRES_USER ??= 'postgres';
process.env.POSTGRES_PASSWORD ??= 'postgres';
process.env.RESEND_API_KEY ??= 'resend-api-key';
process.env.RESEND_FROM_EMAIL ??= 'no-reply@example.com';
process.env.RESEND_FROM_NAME ??= 'Tracking OKRs';
process.env.GITHUB_CLIENT_ID ??= 'github-client-id';
process.env.GITHUB_CLIENT_SECRET ??= 'github-client-secret';
process.env.GITHUB_CALLBACK_URL ??= 'http://localhost:3000/api/v1/auth/github/callback';
process.env.OTEL_EXPORTER_OTLP_ENDPOINT ??= 'http://localhost:4318';

import type { RegisterInput } from '@tracking-okrs/shared-types';

import { createAuthService } from './auth.service.js';
import { AUTH_ERROR_CODES, AuthError } from './auth.errors.js';
import type {
  AuthRepository,
  AuthUserRecord,
  CreateEmailVerificationTokenInput,
  CreateGithubUserInput,
  EmailSender,
  CreateLocalUserInput,
  EmailVerificationTokenRecord,
} from '../types/auth.types.js';

const baseUser: AuthUserRecord = {
  id: 'user-1',
  username: 'alice',
  email: 'alice@example.com',
  name: 'Alice',
  avatarUrl: null,
  job: null,
  isVerified: false,
  passwordHash: 'hashed-password',
};

const buildRepository = (overrides: Partial<AuthRepository> = {}): AuthRepository => ({
  findUserByEmail(): Promise<AuthUserRecord | null> {
    return Promise.resolve(null);
  },
  findUserByUsername(): Promise<AuthUserRecord | null> {
    return Promise.resolve(null);
  },
  findUserById(): Promise<AuthUserRecord | null> {
    return Promise.resolve(null);
  },
  findUserByGithubId(): Promise<AuthUserRecord | null> {
    return Promise.resolve(null);
  },
  createLocalUser(input: CreateLocalUserInput): Promise<AuthUserRecord> {
    return Promise.resolve({
      ...baseUser,
      username: input.username,
      email: input.email,
      name: input.name,
      avatarUrl: input.avatarUrl,
      job: input.job,
      passwordHash: input.passwordHash,
    });
  },
  createGithubUser(input: CreateGithubUserInput) {
    void input;
    throw new Error('Not implemented in tests');
  },
  createEmailVerificationToken(_input: CreateEmailVerificationTokenInput): Promise<void> {
    void _input;
    return Promise.resolve();
  },
  findEmailVerificationTokenByHash(): Promise<EmailVerificationTokenRecord | null> {
    return Promise.resolve(null);
  },
  findLatestEmailVerificationTokenByUserId(): Promise<EmailVerificationTokenRecord | null> {
    return Promise.resolve(null);
  },
  consumeEmailVerificationToken(): Promise<boolean> {
    return Promise.resolve(false);
  },
  invalidateEmailVerificationTokensForUser(): Promise<void> {
    return Promise.resolve();
  },
  markUserAsVerified(): Promise<void> {
    return Promise.resolve();
  },
  ...overrides,
});

const buildRegisterInput = (overrides: Partial<RegisterInput> = {}): RegisterInput => ({
  username: 'alice',
  email: 'Alice@Example.com',
  name: 'Alice',
  password: 'Strong#123',
  confirmPassword: 'Strong#123',
  avatarUrl: 'https://example.com/avatar.png',
  job: 'Engineer',
  ...overrides,
});

void test('register creates an unverified local user and issues a hashed verification token', async () => {
  let createdUserInput: CreateLocalUserInput | undefined;
  let createdTokenInput: CreateEmailVerificationTokenInput | undefined;
  let sentEmail:
    | {
        to: string;
        name: string;
        verificationUrl: string;
      }
    | undefined;

  const service = createAuthService({
    appOrigin: 'http://localhost:3000',
    now: () => new Date('2026-03-26T12:00:00.000Z'),
    emailSender: {
      sendVerificationEmail(input): Promise<void> {
        sentEmail = input;
        return Promise.resolve();
      },
    } satisfies EmailSender,
    passwordHasher: {
      hash(password: string): Promise<string> {
        return Promise.resolve(`hashed:${password}`);
      },
      verify(): Promise<boolean> {
        return Promise.resolve(true);
      },
    },
    repository: buildRepository({
      createLocalUser(input: CreateLocalUserInput): Promise<AuthUserRecord> {
        createdUserInput = input;
        return Promise.resolve({
          ...baseUser,
          id: 'user-created',
          username: input.username,
          email: input.email,
          name: input.name,
          avatarUrl: input.avatarUrl,
          job: input.job,
          passwordHash: input.passwordHash,
        });
      },
      createEmailVerificationToken(input: CreateEmailVerificationTokenInput): Promise<void> {
        createdTokenInput = input;
        return Promise.resolve();
      },
    }),
    tokenGenerator: () => 'plain-token',
    tokenHasher: (token: string): string => `hashed-token:${token}`,
  });

  const response = await service.register(buildRegisterInput());

  assert.deepEqual(createdUserInput, {
    username: 'alice',
    email: 'alice@example.com',
    name: 'Alice',
    passwordHash: 'hashed:Strong#123',
    avatarUrl: 'https://example.com/avatar.png',
    job: 'Engineer',
  });
  assert.deepEqual(createdTokenInput, {
    userId: 'user-created',
    tokenHash: 'hashed-token:plain-token',
    expiresAt: '2026-03-27T12:00:00.000Z',
    sentAt: '2026-03-26T12:00:00.000Z',
  });
  assert.deepEqual(sentEmail, {
    to: 'alice@example.com',
    name: 'Alice',
    verificationUrl: 'http://localhost:3000/api/v1/auth/verify-email?token=plain-token',
  });
  assert.deepEqual(response, {
    email: 'alice@example.com',
    resendAvailableAt: '2026-03-26T12:00:45.000Z',
    deliveryStatus: 'sent',
  });
});

void test('register keeps the created user and exposes pending retry when email delivery fails', async () => {
  const consumedTokenHashes: string[] = [];

  const service = createAuthService({
    appOrigin: 'http://localhost:3000',
    now: () => new Date('2026-03-26T12:00:00.000Z'),
    emailSender: {
      sendVerificationEmail(): Promise<void> {
        return Promise.reject(new Error('provider unavailable'));
      },
    } satisfies EmailSender,
    logger: {
      error(): void {
        return;
      },
    },
    passwordHasher: {
      hash(password: string): Promise<string> {
        return Promise.resolve(`hashed:${password}`);
      },
      verify(): Promise<boolean> {
        return Promise.resolve(true);
      },
    },
    repository: buildRepository({
      createLocalUser(input: CreateLocalUserInput): Promise<AuthUserRecord> {
        return Promise.resolve({
          ...baseUser,
          id: 'user-created',
          username: input.username,
          email: input.email,
          name: input.name,
          avatarUrl: input.avatarUrl,
          job: input.job,
          passwordHash: input.passwordHash,
        });
      },
      consumeEmailVerificationToken(tokenHash: string): Promise<boolean> {
        consumedTokenHashes.push(tokenHash);
        return Promise.resolve(true);
      },
    }),
    tokenGenerator: () => 'plain-token',
    tokenHasher: (token: string): string => `hashed-token:${token}`,
  });

  const response = await service.register(buildRegisterInput());

  assert.deepEqual(consumedTokenHashes, ['hashed-token:plain-token']);
  assert.deepEqual(response, {
    email: 'alice@example.com',
    resendAvailableAt: '2026-03-26T12:00:00.000Z',
    deliveryStatus: 'pending_retry',
  });
});

void test('register rejects duplicate email and password mismatch with deterministic domain errors', async () => {
  const duplicateEmailService = createAuthService({
    repository: buildRepository({
      findUserByEmail(): Promise<AuthUserRecord | null> {
        return Promise.resolve(baseUser);
      },
    }),
  });

  await assert.rejects(
    duplicateEmailService.register(buildRegisterInput()),
    (error: unknown) => error instanceof AuthError && error.code === AUTH_ERROR_CODES.emailConflict,
  );

  const mismatchService = createAuthService({
    repository: buildRepository(),
  });

  await assert.rejects(
    mismatchService.register(buildRegisterInput({ confirmPassword: 'Different#123' })),
    (error: unknown) =>
      error instanceof AuthError && error.code === AUTH_ERROR_CODES.passwordMismatch,
  );

  const weakPasswordService = createAuthService({
    repository: buildRepository(),
  });

  await assert.rejects(
    weakPasswordService.register(
      buildRegisterInput({ password: 'weakpass', confirmPassword: 'weakpass' }),
    ),
    (error: unknown) => error instanceof AuthError && error.code === AUTH_ERROR_CODES.weakPassword,
  );
});

void test('verifyEmailToken marks user as verified and invalidates remaining pending tokens', async () => {
  const calls: string[] = [];

  const service = createAuthService({
    now: () => new Date('2026-03-26T12:00:00.000Z'),
    repository: buildRepository({
      findEmailVerificationTokenByHash(
        tokenHash: string,
      ): Promise<EmailVerificationTokenRecord | null> {
        calls.push(`find:${tokenHash}`);
        return Promise.resolve({
          id: 'token-1',
          userId: 'user-1',
          tokenHash,
          expiresAt: '2026-03-27T12:00:00.000Z',
          sentAt: '2026-03-26T11:59:00.000Z',
          usedAt: null,
        });
      },
      consumeEmailVerificationToken(tokenHash: string): Promise<boolean> {
        calls.push(`consume:${tokenHash}`);
        return Promise.resolve(true);
      },
      markUserAsVerified(userId: string): Promise<void> {
        calls.push(`verify:${userId}`);
        return Promise.resolve();
      },
      invalidateEmailVerificationTokensForUser(userId: string): Promise<void> {
        calls.push(`invalidate:${userId}`);
        return Promise.resolve();
      },
    }),
    tokenHasher: (token: string): string => `hash:${token}`,
  });

  await service.verifyEmailToken('raw-token');

  assert.deepEqual(calls, [
    'find:hash:raw-token',
    'consume:hash:raw-token',
    'verify:user-1',
    'invalidate:user-1',
  ]);
});

void test('verifyEmailToken differentiates invalid and expired tokens', async () => {
  const invalidService = createAuthService({
    repository: buildRepository(),
    tokenHasher: (token: string): string => `hash:${token}`,
  });

  await assert.rejects(
    invalidService.verifyEmailToken('missing-token'),
    (error: unknown) =>
      error instanceof AuthError && error.code === AUTH_ERROR_CODES.invalidVerificationToken,
  );

  const expiredService = createAuthService({
    now: () => new Date('2026-03-26T12:00:00.000Z'),
    repository: buildRepository({
      findEmailVerificationTokenByHash(
        tokenHash: string,
      ): Promise<EmailVerificationTokenRecord | null> {
        return Promise.resolve({
          id: 'token-1',
          userId: 'user-1',
          tokenHash,
          expiresAt: '2026-03-25T12:00:00.000Z',
          sentAt: '2026-03-25T11:00:00.000Z',
          usedAt: null,
        });
      },
    }),
    tokenHasher: (token: string): string => `hash:${token}`,
  });

  await assert.rejects(
    expiredService.verifyEmailToken('expired-token'),
    (error: unknown) =>
      error instanceof AuthError && error.code === AUTH_ERROR_CODES.expiredVerificationToken,
  );

  const consumedService = createAuthService({
    now: () => new Date('2026-03-26T12:00:00.000Z'),
    repository: buildRepository({
      findEmailVerificationTokenByHash(
        tokenHash: string,
      ): Promise<EmailVerificationTokenRecord | null> {
        return Promise.resolve({
          id: 'token-1',
          userId: 'user-1',
          tokenHash,
          expiresAt: '2026-03-27T12:00:00.000Z',
          sentAt: '2026-03-26T11:00:00.000Z',
          usedAt: '2026-03-26T11:30:00.000Z',
        });
      },
    }),
    tokenHasher: (token: string): string => `hash:${token}`,
  });

  await assert.rejects(
    consumedService.verifyEmailToken('used-token'),
    (error: unknown) =>
      error instanceof AuthError && error.code === AUTH_ERROR_CODES.invalidVerificationToken,
  );
});

void test('resendVerificationEmail enforces the 45-second cooldown and returns deterministic availability', async () => {
  const currentTime = new Date('2026-03-26T12:00:30.000Z');

  const coolingDownService = createAuthService({
    now: () => currentTime,
    repository: buildRepository({
      findUserByEmail(): Promise<AuthUserRecord | null> {
        return Promise.resolve(baseUser);
      },
      findLatestEmailVerificationTokenByUserId(): Promise<EmailVerificationTokenRecord | null> {
        return Promise.resolve({
          id: 'token-1',
          userId: 'user-1',
          tokenHash: 'token-hash',
          expiresAt: '2026-03-27T12:00:00.000Z',
          sentAt: '2026-03-26T12:00:00.000Z',
          usedAt: null,
        });
      },
    }),
  });

  await assert.rejects(
    coolingDownService.resendVerificationEmail('alice@example.com'),
    (error: unknown) =>
      error instanceof AuthError &&
      error.code === AUTH_ERROR_CODES.cooldownActive &&
      error.details?.resendAvailableAt === '2026-03-26T12:00:45.000Z',
  );

  let createdTokenInput: CreateEmailVerificationTokenInput | undefined;

  const resendService = createAuthService({
    appOrigin: 'http://localhost:3000',
    now: () => new Date('2026-03-26T12:01:00.000Z'),
    emailSender: {
      sendVerificationEmail(): Promise<void> {
        return Promise.resolve();
      },
    } satisfies EmailSender,
    repository: buildRepository({
      findUserByEmail(): Promise<AuthUserRecord | null> {
        return Promise.resolve(baseUser);
      },
      findLatestEmailVerificationTokenByUserId(): Promise<EmailVerificationTokenRecord | null> {
        return Promise.resolve({
          id: 'token-1',
          userId: 'user-1',
          tokenHash: 'token-hash',
          expiresAt: '2026-03-27T12:00:00.000Z',
          sentAt: '2026-03-26T12:00:00.000Z',
          usedAt: null,
        });
      },
      createEmailVerificationToken(input: CreateEmailVerificationTokenInput): Promise<void> {
        createdTokenInput = input;
        return Promise.resolve();
      },
    }),
    tokenGenerator: () => 'second-token',
    tokenHasher: (token: string): string => `hash:${token}`,
  });

  const response = await resendService.resendVerificationEmail('Alice@Example.com');

  assert.equal(createdTokenInput?.tokenHash, 'hash:second-token');
  assert.deepEqual(response, {
    resendAvailableAt: '2026-03-26T12:01:45.000Z',
    deliveryStatus: 'sent',
  });
});

void test('resendVerificationEmail exposes pending retry and clears cooldown state when email delivery fails', async () => {
  const consumedTokenHashes: string[] = [];

  const service = createAuthService({
    appOrigin: 'http://localhost:3000',
    now: () => new Date('2026-03-26T12:01:00.000Z'),
    emailSender: {
      sendVerificationEmail(): Promise<void> {
        return Promise.reject(new Error('provider unavailable'));
      },
    } satisfies EmailSender,
    logger: {
      error(): void {
        return;
      },
    },
    repository: buildRepository({
      findUserByEmail(): Promise<AuthUserRecord | null> {
        return Promise.resolve(baseUser);
      },
      consumeEmailVerificationToken(tokenHash: string): Promise<boolean> {
        consumedTokenHashes.push(tokenHash);
        return Promise.resolve(true);
      },
    }),
    tokenGenerator: () => 'second-token',
    tokenHasher: (token: string): string => `hash:${token}`,
  });

  const response = await service.resendVerificationEmail('alice@example.com');

  assert.deepEqual(consumedTokenHashes, ['hash:second-token']);
  assert.deepEqual(response, {
    resendAvailableAt: '2026-03-26T12:01:00.000Z',
    deliveryStatus: 'pending_retry',
  });
});

void test('validateCredentials rejects invalid credentials', async () => {
  const invalidService = createAuthService({
    passwordHasher: {
      hash(password: string): Promise<string> {
        return Promise.resolve(password);
      },
      verify(): Promise<boolean> {
        return Promise.resolve(false);
      },
    },
    repository: buildRepository({
      findUserByEmail(): Promise<AuthUserRecord | null> {
        return Promise.resolve(baseUser);
      },
    }),
  });

  await assert.rejects(
    invalidService.validateCredentials('alice@example.com', 'wrong-password'),
    (error: unknown) =>
      error instanceof AuthError && error.code === AUTH_ERROR_CODES.invalidCredentials,
  );
});

void test('validateCredentials allows unverified users when verification enforcement is disabled', async () => {
  const service = createAuthService({
    passwordHasher: {
      hash(password: string): Promise<string> {
        return Promise.resolve(password);
      },
      verify(): Promise<boolean> {
        return Promise.resolve(true);
      },
    },
    repository: buildRepository({
      findUserByEmail(): Promise<AuthUserRecord | null> {
        return Promise.resolve(baseUser);
      },
    }),
  });

  const user = await service.validateCredentials('alice@example.com', 'Strong#123');

  assert.deepEqual(user, {
    id: 'user-1',
    username: 'alice',
    email: 'alice@example.com',
    name: 'Alice',
    avatarUrl: null,
    job: null,
    isVerified: false,
  });
});

void test('validateCredentials rejects unverified users when verification enforcement is enabled', async () => {
  const service = createAuthService({
    requireEmailVerificationForLogin: true,
    passwordHasher: {
      hash(password: string): Promise<string> {
        return Promise.resolve(password);
      },
      verify(): Promise<boolean> {
        return Promise.resolve(true);
      },
    },
    repository: buildRepository({
      findUserByEmail(): Promise<AuthUserRecord | null> {
        return Promise.resolve(baseUser);
      },
    }),
  });

  await assert.rejects(
    service.validateCredentials('alice@example.com', 'Strong#123'),
    (error: unknown) =>
      error instanceof AuthError && error.code === AUTH_ERROR_CODES.emailNotVerified,
  );
});

void test('validateCredentials returns the auth user for verified local accounts', async () => {
  const service = createAuthService({
    passwordHasher: {
      hash(password: string): Promise<string> {
        return Promise.resolve(password);
      },
      verify(): Promise<boolean> {
        return Promise.resolve(true);
      },
    },
    repository: buildRepository({
      findUserByEmail(): Promise<AuthUserRecord | null> {
        return Promise.resolve({
          ...baseUser,
          isVerified: true,
        });
      },
    }),
  });

  const user = await service.validateCredentials('Alice@Example.com', 'Strong#123');

  assert.deepEqual(user, {
    id: 'user-1',
    username: 'alice',
    email: 'alice@example.com',
    name: 'Alice',
    avatarUrl: null,
    job: null,
    isVerified: true,
  });
});

void test('authenticateWithGithubProfile creates a verified GitHub user and resolves username conflicts', async () => {
  let receivedInput: CreateGithubUserInput | undefined;

  const service = createAuthService({
    repository: buildRepository({
      findUserByEmail(): Promise<AuthUserRecord | null> {
        return Promise.resolve(null);
      },
      findUserByUsername(username: string): Promise<AuthUserRecord | null> {
        return Promise.resolve(username === 'alice' ? baseUser : null);
      },
      createGithubUser(input: CreateGithubUserInput): Promise<AuthUserRecord> {
        receivedInput = input;
        return Promise.resolve({
          ...baseUser,
          id: 'github-user',
          username: input.username,
          email: input.email,
          name: input.name,
          avatarUrl: input.avatarUrl,
          job: input.job,
          isVerified: true,
          passwordHash: null,
        });
      },
    }),
  });

  const user = await service.authenticateWithGithubProfile({
    id: 'gh-1',
    username: 'alice',
    displayName: 'Alice Octocat',
    primaryEmail: 'Alice@Example.com',
    avatarUrl: 'https://example.com/octocat.png',
  });

  assert.deepEqual(receivedInput, {
    githubId: 'gh-1',
    email: 'alice@example.com',
    username: 'alice-2',
    name: 'Alice Octocat',
    avatarUrl: 'https://example.com/octocat.png',
    job: null,
    providerEmail: 'alice@example.com',
  });
  assert.equal(user.isVerified, true);
});

void test('authenticateWithGithubProfile rejects missing emails and existing local email conflicts', async () => {
  const missingEmailService = createAuthService({
    repository: buildRepository(),
  });

  await assert.rejects(
    missingEmailService.authenticateWithGithubProfile({
      id: 'gh-1',
      username: 'alice',
      displayName: 'Alice',
      primaryEmail: null,
      avatarUrl: null,
    }),
    (error: unknown) =>
      error instanceof AuthError && error.code === AUTH_ERROR_CODES.socialEmailMissing,
  );

  const conflictService = createAuthService({
    repository: buildRepository({
      findUserByEmail(): Promise<AuthUserRecord | null> {
        return Promise.resolve({
          ...baseUser,
          isVerified: true,
        });
      },
    }),
  });

  await assert.rejects(
    conflictService.authenticateWithGithubProfile({
      id: 'gh-2',
      username: 'alice',
      displayName: 'Alice',
      primaryEmail: 'alice@example.com',
      avatarUrl: null,
    }),
    (error: unknown) => error instanceof AuthError && error.code === AUTH_ERROR_CODES.emailConflict,
  );
});
