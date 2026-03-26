import assert from 'node:assert/strict';
import test from 'node:test';

import type { NextFunction, RequestHandler, Router } from 'express';
import type { IVerifyOptions } from 'passport-local';

import type { AuthUser } from '@tracking-okrs/shared-types';

const ensureAuthEnv = (): void => {
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
};

type PassportAuthenticateCallback = (
  error: Error | null,
  user?: Express.User | false,
  info?: IVerifyOptions & {
    code?: string;
  },
) => void;

type FakeAuthenticator = {
  authenticate(
    strategy: string,
    options?: Record<string, unknown>,
    callback?: PassportAuthenticateCallback,
  ): RequestHandler;
};

type ControllerService = {
  register(input: Record<string, unknown>): Promise<{
    email: string;
    resendAvailableAt: string;
    deliveryStatus: 'sent' | 'pending_retry';
  }>;
  resendVerificationEmail(email: string): Promise<{
    resendAvailableAt: string;
    deliveryStatus: 'sent' | 'pending_retry';
  }>;
  verifyEmailToken(token: string): Promise<void>;
};

type AuthResult = {
  error?: Error | null;
  user?: AuthUser | false;
  info?: IVerifyOptions & {
    code?: string;
  };
};

type TestRouterOptions = {
  service?: Partial<ControllerService>;
  localLoginResult?: AuthResult;
  githubCallbackResult?: AuthResult;
};

type MockRequest = {
  body?: unknown;
  query?: Record<string, unknown>;
  session: Record<string, unknown>;
  user?: Express.User;
  logIn: (user: Express.User, callback: (error?: Error | null) => void) => void;
  logout: (callback: (error?: Error | null) => void) => void;
};

type MockResponse = {
  statusCode: number;
  body: unknown;
  redirectUrl: string | null;
  headers: Record<string, string>;
  clearedCookies: string[];
  ended: boolean;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
  send: (payload?: unknown) => MockResponse;
  redirect: (statusOrUrl: number | string, url?: string) => MockResponse;
  clearCookie: (name: string) => MockResponse;
};

const baseUser: AuthUser = {
  id: 'user-1',
  username: 'alice',
  email: 'alice@example.com',
  name: 'Alice',
  avatarUrl: null,
  job: null,
  isVerified: true,
};

const createFakeAuthenticator = (
  localLoginResult: AuthResult,
  githubCallbackResult: AuthResult,
): FakeAuthenticator => ({
  authenticate(
    strategy: string,
    _options?: Record<string, unknown>,
    callback?: PassportAuthenticateCallback,
  ): RequestHandler {
    return (_request, response, next) => {
      if (!callback) {
        if (strategy === 'github') {
          response.redirect(302, 'https://github.com/login/oauth/authorize');
          return;
        }

        next();
        return;
      }

      if (strategy === 'local') {
        callback(localLoginResult.error ?? null, localLoginResult.user, localLoginResult.info);
        return;
      }

      if (strategy === 'github') {
        callback(
          githubCallbackResult.error ?? null,
          githubCallbackResult.user,
          githubCallbackResult.info,
        );
        return;
      }

      next();
    };
  },
});

const createMockResponse = (): MockResponse => ({
  statusCode: 200,
  body: undefined,
  redirectUrl: null,
  headers: {},
  clearedCookies: [],
  ended: false,
  status(code: number): MockResponse {
    this.statusCode = code;
    return this;
  },
  json(payload: unknown): MockResponse {
    this.body = payload;
    this.ended = true;
    return this;
  },
  send(payload?: unknown): MockResponse {
    this.body = payload;
    this.ended = true;
    return this;
  },
  redirect(statusOrUrl: number | string, url?: string): MockResponse {
    this.statusCode = typeof statusOrUrl === 'number' ? statusOrUrl : 302;
    this.redirectUrl = typeof statusOrUrl === 'string' ? statusOrUrl : (url ?? null);
    this.ended = true;
    return this;
  },
  clearCookie(name: string): MockResponse {
    this.clearedCookies.push(name);
    return this;
  },
});

const getRouteHandlers = (router: Router, method: string, path: string): RequestHandler[] => {
  const layer = router.stack.find(
    (entry) => (entry.route as { path?: string } | undefined)?.path === path,
  );

  if (!layer?.route) {
    throw new Error(`Route not found: ${method.toUpperCase()} ${path}`);
  }

  const routeMethods = Object.keys(
    (layer.route as { methods?: Record<string, boolean> }).methods ?? {},
  );

  if (!routeMethods.includes(method.toLowerCase())) {
    throw new Error(`Method not found for route: ${method.toUpperCase()} ${path}`);
  }

  return layer.route.stack.map((routeLayer) => routeLayer.handle as RequestHandler);
};

const runHandlers = async (
  handlers: RequestHandler[],
  request: MockRequest,
  response: MockResponse,
): Promise<void> => {
  let index = 0;

  const dispatch = async (): Promise<void> => {
    if (response.ended || index >= handlers.length) {
      return;
    }

    const handler = handlers[index];

    if (!handler) {
      throw new Error('Handler not found');
    }

    index += 1;

    await new Promise<void>((resolve, reject) => {
      const next: NextFunction = (error?: unknown) => {
        if (error) {
          reject(error instanceof Error ? error : new Error('Unexpected middleware error'));
          return;
        }

        resolve();
      };

      try {
        const result = handler(request as never, response as never, next);

        Promise.resolve(result).then(
          () => {
            resolve();
          },
          (error: unknown) => {
            reject(error instanceof Error ? error : new Error(String(error)));
          },
        );
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });

    await dispatch();
  };

  await dispatch();
};

const createTestRouter = async (options: TestRouterOptions = {}) => {
  ensureAuthEnv();

  const [{ createAuthController }, { createAuthRouter }, { AuthError, AUTH_ERROR_CODES }] =
    await Promise.all([
      import('../modules/auth/controllers/auth.controller.js'),
      import('./auth.routes.js'),
      import('../modules/auth/services/auth.errors.js'),
    ]);

  const service: ControllerService = {
    register: () =>
      Promise.resolve({
        email: 'alice@example.com',
        resendAvailableAt: '2026-03-26T12:00:45.000Z',
        deliveryStatus: 'sent',
      }),
    resendVerificationEmail: () =>
      Promise.resolve({
        resendAvailableAt: '2026-03-26T12:00:45.000Z',
        deliveryStatus: 'sent',
      }),
    verifyEmailToken: () => Promise.resolve(),
    ...options.service,
  };

  return {
    router: createAuthRouter({
      controller: createAuthController({
        appOrigin: 'http://localhost:3000',
        service: service as never,
      }),
      authenticator: createFakeAuthenticator(
        options.localLoginResult ?? {
          user: baseUser,
        },
        options.githubCallbackResult ?? {
          user: baseUser,
        },
      ),
    }),
    AuthError,
    AUTH_ERROR_CODES,
  };
};

void test('POST /register returns the registration payload', async () => {
  const { router } = await createTestRouter();
  const response = createMockResponse();

  await runHandlers(
    getRouteHandlers(router, 'post', '/register'),
    {
      body: {
        username: 'alice',
        email: 'alice@example.com',
        name: 'Alice',
        password: 'Strong#123',
        confirmPassword: 'Strong#123',
      },
      query: {},
      session: {},
      logIn: (_user, callback) => {
        callback(null);
      },
      logout: (callback) => {
        callback(null);
      },
    },
    response,
  );

  assert.equal(response.statusCode, 201);
  assert.deepEqual(response.body, {
    data: {
      email: 'alice@example.com',
      resendAvailableAt: '2026-03-26T12:00:45.000Z',
      deliveryStatus: 'sent',
    },
  });
});

void test('POST /login creates session state and GET /me returns the authenticated user', async () => {
  const { router } = await createTestRouter();
  const sessionState: Record<string, unknown> = {};
  const loginResponse = createMockResponse();

  await runHandlers(
    getRouteHandlers(router, 'post', '/login'),
    {
      body: {
        email: 'alice@example.com',
        password: 'Strong#123',
      },
      query: {},
      session: sessionState,
      logIn: function logIn(user, callback) {
        this.user = user;
        sessionState.passport = { user: user.id };
        callback(null);
      },
      logout: (callback) => {
        callback(null);
      },
    },
    loginResponse,
  );

  assert.equal(loginResponse.statusCode, 200);
  assert.deepEqual(loginResponse.body, {
    data: {
      user: baseUser,
    },
  });
  assert.deepEqual(sessionState, {
    passport: {
      user: 'user-1',
    },
  });

  const meResponse = createMockResponse();

  await runHandlers(
    getRouteHandlers(router, 'get', '/me'),
    {
      body: undefined,
      query: {},
      session: sessionState,
      user: baseUser,
      logIn: function logIn(user, callback) {
        this.user = user;
        callback(null);
      },
      logout: (callback) => {
        callback(null);
      },
    },
    meResponse,
  );

  assert.equal(meResponse.statusCode, 200);
  assert.deepEqual(meResponse.body, {
    data: {
      user: baseUser,
    },
  });
});

void test('POST /login can create a session for an unverified account when enforcement is disabled', async () => {
  const { router } = await createTestRouter({
    localLoginResult: {
      user: {
        ...baseUser,
        isVerified: false,
      },
    },
  });
  const sessionState: Record<string, unknown> = {};
  const response = createMockResponse();

  await runHandlers(
    getRouteHandlers(router, 'post', '/login'),
    {
      body: {
        email: 'alice@example.com',
        password: 'Strong#123',
      },
      query: {},
      session: sessionState,
      logIn: function logIn(user, callback) {
        this.user = user;
        sessionState.passport = { user: user.id };
        callback(null);
      },
      logout: (callback) => {
        callback(null);
      },
    },
    response,
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, {
    data: {
      user: {
        ...baseUser,
        isVerified: false,
      },
    },
  });
});

void test('POST /login maps unverified credential failures to 403 JSON', async () => {
  const { router } = await createTestRouter({
    localLoginResult: {
      user: false,
      info: {
        code: 'email_not_verified',
        message: 'Email address is not verified',
      },
    },
  });
  const response = createMockResponse();

  await runHandlers(
    getRouteHandlers(router, 'post', '/login'),
    {
      body: {
        email: 'alice@example.com',
        password: 'Strong#123',
      },
      query: {},
      session: {},
      logIn: (_user, callback) => {
        callback(null);
      },
      logout: (callback) => {
        callback(null);
      },
    },
    response,
  );

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, {
    error: {
      code: 'email_not_verified',
      message: 'Email address is not verified',
    },
  });
});

void test('GET /verify-email redirects to stable success and expired result routes', async () => {
  const { router, AuthError, AUTH_ERROR_CODES } = await createTestRouter();
  const verifiedResponse = createMockResponse();

  await runHandlers(
    getRouteHandlers(router, 'get', '/verify-email'),
    {
      body: undefined,
      query: {
        token: 'valid-token',
      },
      session: {},
      logIn: (_user, callback) => {
        callback(null);
      },
      logout: (callback) => {
        callback(null);
      },
    },
    verifiedResponse,
  );

  assert.equal(verifiedResponse.statusCode, 302);
  assert.equal(
    verifiedResponse.redirectUrl,
    'http://localhost:3000/verify-email/result?status=verified',
  );

  const { router: expiredRouter } = await createTestRouter({
    service: {
      verifyEmailToken: () => {
        throw new AuthError(
          AUTH_ERROR_CODES.expiredVerificationToken,
          'Verification token has expired',
          { statusCode: 400 },
        );
      },
    },
  });
  const expiredResponse = createMockResponse();

  await runHandlers(
    getRouteHandlers(expiredRouter, 'get', '/verify-email'),
    {
      body: undefined,
      query: {
        token: 'expired-token',
      },
      session: {},
      logIn: (_user, callback) => {
        callback(null);
      },
      logout: (callback) => {
        callback(null);
      },
    },
    expiredResponse,
  );

  assert.equal(expiredResponse.statusCode, 302);
  assert.equal(
    expiredResponse.redirectUrl,
    'http://localhost:3000/verify-email/result?status=expired',
  );

  const { router: invalidRouter } = await createTestRouter({
    service: {
      verifyEmailToken: () => {
        throw new AuthError(
          AUTH_ERROR_CODES.invalidVerificationToken,
          'Verification token is invalid',
          { statusCode: 400 },
        );
      },
    },
  });
  const invalidResponse = createMockResponse();

  await runHandlers(
    getRouteHandlers(invalidRouter, 'get', '/verify-email'),
    {
      body: undefined,
      query: {
        token: 'invalid-token',
      },
      session: {},
      logIn: (_user, callback) => {
        callback(null);
      },
      logout: (callback) => {
        callback(null);
      },
    },
    invalidResponse,
  );

  assert.equal(invalidResponse.statusCode, 302);
  assert.equal(
    invalidResponse.redirectUrl,
    'http://localhost:3000/verify-email/result?status=invalid',
  );
});

void test('POST /resend-verification returns cooldown details', async () => {
  const { router, AuthError, AUTH_ERROR_CODES } = await createTestRouter({
    service: {
      resendVerificationEmail: () => {
        throw new AuthError(
          AUTH_ERROR_CODES.cooldownActive,
          'Verification resend is cooling down',
          {
            statusCode: 429,
            details: {
              resendAvailableAt: '2026-03-26T12:00:45.000Z',
            },
          },
        );
      },
    },
  });
  const response = createMockResponse();

  await runHandlers(
    getRouteHandlers(router, 'post', '/resend-verification'),
    {
      body: {
        email: 'alice@example.com',
      },
      query: {},
      session: {},
      logIn: (_user, callback) => {
        callback(null);
      },
      logout: (callback) => {
        callback(null);
      },
    },
    response,
  );

  assert.equal(response.statusCode, 429);
  assert.deepEqual(response.body, {
    error: {
      code: 'cooldown_active',
      message: 'Verification resend is cooling down',
      details: {
        resendAvailableAt: '2026-03-26T12:00:45.000Z',
      },
    },
  });
});

void test('GET /github/callback creates session state and redirects to the app root', async () => {
  const { router } = await createTestRouter({
    githubCallbackResult: {
      user: baseUser,
    },
  });
  const sessionState: Record<string, unknown> = {};
  const response = createMockResponse();

  await runHandlers(
    getRouteHandlers(router, 'get', '/github/callback'),
    {
      body: undefined,
      query: {},
      session: sessionState,
      logIn: function logIn(user, callback) {
        this.user = user;
        sessionState.passport = { user: user.id };
        callback(null);
      },
      logout: (callback) => {
        callback(null);
      },
    },
    response,
  );

  assert.equal(response.statusCode, 302);
  assert.equal(response.redirectUrl, 'http://localhost:3000/');
  assert.deepEqual(sessionState, {
    passport: {
      user: 'user-1',
    },
  });
});

void test('GET /github/callback redirects conflict and missing-email cases to /login with stable params', async () => {
  const { router: conflictRouter } = await createTestRouter({
    githubCallbackResult: {
      user: false,
      info: {
        code: 'email_conflict',
        message: 'Email is already in use',
      },
    },
  });
  const conflictResponse = createMockResponse();

  await runHandlers(
    getRouteHandlers(conflictRouter, 'get', '/github/callback'),
    {
      body: undefined,
      query: {},
      session: {},
      logIn: (_user, callback) => {
        callback(null);
      },
      logout: (callback) => {
        callback(null);
      },
    },
    conflictResponse,
  );

  assert.equal(conflictResponse.statusCode, 302);
  assert.equal(
    conflictResponse.redirectUrl,
    'http://localhost:3000/login?error=social_auth_failed&reason=email_conflict',
  );

  const { router: missingEmailRouter } = await createTestRouter({
    githubCallbackResult: {
      user: false,
      info: {
        code: 'social_email_missing',
        message: 'GitHub profile does not expose a usable email',
      },
    },
  });
  const missingEmailResponse = createMockResponse();

  await runHandlers(
    getRouteHandlers(missingEmailRouter, 'get', '/github/callback'),
    {
      body: undefined,
      query: {},
      session: {},
      logIn: (_user, callback) => {
        callback(null);
      },
      logout: (callback) => {
        callback(null);
      },
    },
    missingEmailResponse,
  );

  assert.equal(missingEmailResponse.statusCode, 302);
  assert.equal(
    missingEmailResponse.redirectUrl,
    'http://localhost:3000/login?error=social_auth_failed&reason=missing_email',
  );
});

void test('GET /github starts the social authentication redirect', async () => {
  const { router } = await createTestRouter();
  const response = createMockResponse();

  await runHandlers(
    getRouteHandlers(router, 'get', '/github'),
    {
      body: undefined,
      query: {},
      session: {},
      logIn: (_user, callback) => {
        callback(null);
      },
      logout: (callback) => {
        callback(null);
      },
    },
    response,
  );

  assert.equal(response.statusCode, 302);
  assert.equal(response.redirectUrl, 'https://github.com/login/oauth/authorize');
});
