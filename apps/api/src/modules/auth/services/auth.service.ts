import { createHash, randomBytes } from 'node:crypto';

import argon2 from 'argon2';

import type {
  AuthUser,
  RegisterInput,
  RegisterResponse,
  ResendVerificationEmailResponse,
} from '@tracking-okrs/shared-types';

import { authValidation } from '../schemas/auth.schemas.js';
import { authRepository } from '../repositories/auth.repository.js';
import { AUTH_ERROR_CODES, AuthError } from './auth.errors.js';
import type {
  AuthRepository,
  AuthUserRecord,
  EmailDeliveryStatus,
  EmailSender,
  EmailVerificationTokenRecord,
  GithubProfileInput,
} from '../types/auth.types.js';
import { resendEmailSender } from '../integrations/resend-email-sender.js';
import { buildEmailVerificationUrl } from '../integrations/verification-url.js';
import { env } from '../../../config/env.js';

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 45 * 1000;

type PasswordHasher = {
  hash(password: string): Promise<string>;
  verify(hash: string, password: string): Promise<boolean>;
};

type AuthServiceDependencies = {
  appOrigin?: string;
  emailSender?: EmailSender;
  logger?: Pick<Console, 'error'>;
  now?: () => Date;
  passwordHasher?: PasswordHasher;
  requireEmailVerificationForLogin?: boolean;
  repository?: AuthRepository;
  tokenGenerator?: () => string;
  tokenHasher?: (token: string) => string;
};

const defaultPasswordHasher: PasswordHasher = {
  async hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
    });
  },
  async verify(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  },
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();
const normalizeUsername = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
const normalizeOptionalText = (value?: string): string | null => {
  const normalized = value?.trim() ?? '';
  return normalized ? normalized : null;
};

const generateVerificationToken = (): string => randomBytes(32).toString('hex');
const hashVerificationToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

const toAuthUser = (user: AuthUserRecord): AuthUser => ({
  id: user.id,
  username: user.username,
  email: user.email,
  name: user.name,
  avatarUrl: user.avatarUrl,
  job: user.job,
  isVerified: user.isVerified,
});

const isExpired = (token: EmailVerificationTokenRecord, now: Date): boolean =>
  new Date(token.expiresAt).getTime() <= now.getTime();

const getResendAvailableAt = (sentAt: Date): string =>
  new Date(sentAt.getTime() + RESEND_COOLDOWN_MS).toISOString();

export const createAuthService = (dependencies: AuthServiceDependencies = {}) => {
  const appOrigin = dependencies.appOrigin ?? env.APP_ORIGIN;
  const emailSender = dependencies.emailSender ?? resendEmailSender;
  const logger = dependencies.logger ?? console;
  const repository = dependencies.repository ?? authRepository;
  const now = dependencies.now ?? (() => new Date());
  const passwordHasher = dependencies.passwordHasher ?? defaultPasswordHasher;
  const requireEmailVerificationForLogin =
    dependencies.requireEmailVerificationForLogin ??
    env.AUTH_REQUIRE_EMAIL_VERIFICATION_FOR_LOGIN;
  const tokenGenerator = dependencies.tokenGenerator ?? generateVerificationToken;
  const tokenHasher = dependencies.tokenHasher ?? hashVerificationToken;

  const issueVerificationToken = async (
    userId: string,
    issuedAt: Date,
  ): Promise<{ rawToken: string; tokenHash: string; resendAvailableAt: string }> => {
    const rawToken = tokenGenerator();
    const tokenHash = tokenHasher(rawToken);
    const expiresAt = new Date(issuedAt.getTime() + VERIFICATION_TOKEN_TTL_MS).toISOString();
    const sentAt = issuedAt.toISOString();

    await repository.createEmailVerificationToken({
      userId,
      tokenHash,
      expiresAt,
      sentAt,
    });

    return {
      rawToken,
      tokenHash,
      resendAvailableAt: getResendAvailableAt(issuedAt),
    };
  };

  const sendVerificationEmail = async (input: {
    email: string;
    name: string;
    rawToken: string;
    resendAvailableAt: string;
    tokenHash: string;
  }): Promise<{ deliveryStatus: EmailDeliveryStatus; resendAvailableAt: string }> => {
    try {
      await emailSender.sendVerificationEmail({
        to: input.email,
        name: input.name,
        verificationUrl: buildEmailVerificationUrl(appOrigin, input.rawToken),
      });

      return {
        deliveryStatus: 'sent',
        resendAvailableAt: input.resendAvailableAt,
      };
    } catch (error) {
      await repository.consumeEmailVerificationToken(input.tokenHash);
      logger.error('Verification email delivery failed', {
        email: input.email,
        error,
      });

      return {
        deliveryStatus: 'pending_retry',
        resendAvailableAt: now().toISOString(),
      };
    }
  };

  const resolveGithubUsername = async (profile: GithubProfileInput): Promise<string> => {
    const candidates = [
      profile.username ?? '',
      profile.primaryEmail?.split('@')[0] ?? '',
      `github-${profile.id}`,
    ];

    const baseUsername =
      candidates.map(normalizeUsername).find((candidate) => candidate.length >= 3) ??
      `github-${profile.id}`;

    for (let index = 0; index < 100; index += 1) {
      const candidate = index === 0 ? baseUsername : `${baseUsername}-${index + 1}`;
      const existingUser = await repository.findUserByUsername(candidate);

      if (!existingUser) {
        return candidate;
      }
    }

    throw new AuthError(AUTH_ERROR_CODES.usernameConflict, 'Could not allocate a GitHub username', {
      statusCode: 409,
    });
  };

  return {
    async register(input: RegisterInput): Promise<RegisterResponse> {
      if (input.password !== input.confirmPassword) {
        throw new AuthError(
          AUTH_ERROR_CODES.passwordMismatch,
          'Password confirmation does not match',
          { statusCode: 400 },
        );
      }

      if (!authValidation.isStrongPassword(input.password)) {
        throw new AuthError(
          AUTH_ERROR_CODES.weakPassword,
          'Password must have at least 8 characters, 1 number, and 1 special character',
          { statusCode: 400 },
        );
      }

      const email = normalizeEmail(input.email);
      const username = input.username.trim();
      const currentTime = now();

      const [existingUserByEmail, existingUserByUsername] = await Promise.all([
        repository.findUserByEmail(email),
        repository.findUserByUsername(username),
      ]);

      if (existingUserByEmail) {
        throw new AuthError(AUTH_ERROR_CODES.emailConflict, 'Email is already in use', {
          statusCode: 409,
        });
      }

      if (existingUserByUsername) {
        throw new AuthError(AUTH_ERROR_CODES.usernameConflict, 'Username is already in use', {
          statusCode: 409,
        });
      }

      const passwordHash = await passwordHasher.hash(input.password);
      const user = await repository.createLocalUser({
        username,
        email,
        name: input.name.trim(),
        passwordHash,
        avatarUrl: normalizeOptionalText(input.avatarUrl),
        job: normalizeOptionalText(input.job),
      });

      const tokenState = await issueVerificationToken(user.id, currentTime);
      const delivery = await sendVerificationEmail({
        email: user.email,
        name: user.name,
        rawToken: tokenState.rawToken,
        resendAvailableAt: tokenState.resendAvailableAt,
        tokenHash: tokenState.tokenHash,
      });

      return {
        email: user.email,
        resendAvailableAt: delivery.resendAvailableAt,
        deliveryStatus: delivery.deliveryStatus,
      };
    },

    async verifyEmailToken(token: string): Promise<void> {
      const currentTime = now();
      const tokenHash = tokenHasher(token);
      const verificationToken = await repository.findEmailVerificationTokenByHash(tokenHash);

      if (!verificationToken || verificationToken.usedAt) {
        throw new AuthError(
          AUTH_ERROR_CODES.invalidVerificationToken,
          'Verification token is invalid',
          { statusCode: 400 },
        );
      }

      if (isExpired(verificationToken, currentTime)) {
        throw new AuthError(
          AUTH_ERROR_CODES.expiredVerificationToken,
          'Verification token has expired',
          { statusCode: 400 },
        );
      }

      const wasConsumed = await repository.consumeEmailVerificationToken(tokenHash);

      if (!wasConsumed) {
        throw new AuthError(
          AUTH_ERROR_CODES.invalidVerificationToken,
          'Verification token is invalid',
          { statusCode: 400 },
        );
      }

      await repository.markUserAsVerified(verificationToken.userId);
      await repository.invalidateEmailVerificationTokensForUser(verificationToken.userId);
    },

    async resendVerificationEmail(email: string): Promise<ResendVerificationEmailResponse> {
      const normalizedEmail = normalizeEmail(email);
      const user = await repository.findUserByEmail(normalizedEmail);

      if (!user) {
        throw new AuthError(AUTH_ERROR_CODES.emailNotFound, 'Email was not found', {
          statusCode: 404,
        });
      }

      if (user.isVerified) {
        return {
          resendAvailableAt: now().toISOString(),
          deliveryStatus: 'sent',
        };
      }

      const currentTime = now();
      const latestToken = await repository.findLatestEmailVerificationTokenByUserId(user.id);

      if (latestToken) {
        const resendAvailableAt = getResendAvailableAt(new Date(latestToken.sentAt));

        if (new Date(resendAvailableAt).getTime() > currentTime.getTime()) {
          throw new AuthError(
            AUTH_ERROR_CODES.cooldownActive,
            'Verification resend is cooling down',
            {
              statusCode: 429,
              details: {
                resendAvailableAt,
              },
            },
          );
        }
      }

      const tokenState = await issueVerificationToken(user.id, currentTime);

      return sendVerificationEmail({
        email: user.email,
        name: user.name,
        rawToken: tokenState.rawToken,
        resendAvailableAt: tokenState.resendAvailableAt,
        tokenHash: tokenState.tokenHash,
      });
    },

    async validateCredentials(email: string, password: string): Promise<AuthUser> {
      const normalizedEmail = normalizeEmail(email);
      const user = await repository.findUserByEmail(normalizedEmail);

      if (!user?.passwordHash) {
        throw new AuthError(AUTH_ERROR_CODES.invalidCredentials, 'Invalid email or password', {
          statusCode: 401,
        });
      }

      const isValid = await passwordHasher.verify(user.passwordHash, password);

      if (!isValid) {
        throw new AuthError(AUTH_ERROR_CODES.invalidCredentials, 'Invalid email or password', {
          statusCode: 401,
        });
      }

      if (requireEmailVerificationForLogin && !user.isVerified) {
        throw new AuthError(AUTH_ERROR_CODES.emailNotVerified, 'Email address is not verified', {
          statusCode: 403,
        });
      }

      return toAuthUser(user);
    },

    async authenticateWithGithubProfile(profile: GithubProfileInput): Promise<AuthUser> {
      const existingUser = await repository.findUserByGithubId(profile.id);

      if (existingUser) {
        return existingUser;
      }

      const primaryEmail = profile.primaryEmail ? normalizeEmail(profile.primaryEmail) : null;

      if (!primaryEmail) {
        throw new AuthError(
          AUTH_ERROR_CODES.socialEmailMissing,
          'GitHub profile does not expose a usable email',
          { statusCode: 400 },
        );
      }

      const userWithSameEmail = await repository.findUserByEmail(primaryEmail);

      if (userWithSameEmail) {
        throw new AuthError(
          AUTH_ERROR_CODES.emailConflict,
          'Email is already in use by an existing account',
          { statusCode: 409 },
        );
      }

      const username = await resolveGithubUsername({
        ...profile,
        primaryEmail,
      });
      const fallbackName = profile.displayName?.trim() ?? profile.username?.trim() ?? username;

      return repository.createGithubUser({
        githubId: profile.id,
        email: primaryEmail,
        username,
        name: fallbackName,
        avatarUrl: profile.avatarUrl ?? null,
        job: null,
        providerEmail: primaryEmail,
      });
    },
  };
};

export const authService = createAuthService();
