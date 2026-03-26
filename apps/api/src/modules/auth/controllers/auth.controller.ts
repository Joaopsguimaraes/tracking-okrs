import type { NextFunction, Request, RequestHandler, Response } from 'express';

import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  AuthSessionResponse,
  RegisterResponse,
  ResendVerificationEmailResponse,
} from '@tracking-okrs/shared-types';

import { env } from '../../../config/env.js';
import {
  registerSchema,
  loginSchema,
  resendVerificationEmailSchema,
} from '../schemas/auth.schemas.js';
import { authService } from '../services/auth.service.js';
import { AUTH_ERROR_CODES, AuthError } from '../services/auth.errors.js';

type ControllerDependencies = {
  appOrigin?: string;
  service?: typeof authService;
};

type PassportFailureInfo = {
  code?: string;
  message: string;
};

const toValidationErrorResponse = (
  message: string,
  details: Record<string, string[] | undefined>,
) => ({
  statusCode: 400,
  body: {
    error: {
      code: 'validation_error',
      message,
      details,
    },
  } satisfies ApiErrorResponse,
});

const toAuthErrorResponse = (
  error: AuthError | PassportFailureInfo | null | undefined,
): {
  statusCode: number;
  body: ApiErrorResponse;
} => {
  if (error instanceof AuthError) {
    const details = error.details
      ? ({
          details: error.details,
        } satisfies Pick<ApiErrorResponse['error'], 'details'>)
      : {};

    return {
      statusCode: error.statusCode,
      body: {
        error: {
          code: error.code,
          message: error.message,
          ...details,
        },
      },
    };
  }

  const code = error?.code ?? AUTH_ERROR_CODES.invalidCredentials;
  const statusCode = code === AUTH_ERROR_CODES.emailNotVerified ? 403 : 401;

  return {
    statusCode,
    body: {
      error: {
        code,
        message: error?.message ?? 'Authentication failed',
      },
    },
  };
};

const getGithubFailureReason = (
  error: AuthError | PassportFailureInfo | null | undefined,
): string => {
  switch (error?.code) {
    case AUTH_ERROR_CODES.emailConflict:
      return 'email_conflict';
    case AUTH_ERROR_CODES.socialEmailMissing:
      return 'missing_email';
    default:
      return 'unknown';
  }
};

const buildRedirectUrl = (
  appOrigin: string,
  path: string,
  searchParams: Record<string, string>,
): string => {
  const url = new URL(path, appOrigin);

  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
};

export const createAuthController = (dependencies: ControllerDependencies = {}) => {
  const service = dependencies.service ?? authService;
  const appOrigin = dependencies.appOrigin ?? env.APP_ORIGIN;

  const register: RequestHandler = async (
    request: Request,
    response: Response<ApiSuccessResponse<RegisterResponse> | ApiErrorResponse>,
  ): Promise<void> => {
    const parsedBody = registerSchema.safeParse(request.body);

    if (!parsedBody.success) {
      const errorResponse = toValidationErrorResponse(
        'Invalid register payload',
        parsedBody.error.flatten().fieldErrors,
      );
      response.status(errorResponse.statusCode).json(errorResponse.body);
      return;
    }

    try {
      const registration = await service.register({
        username: parsedBody.data.username,
        email: parsedBody.data.email,
        name: parsedBody.data.name,
        password: parsedBody.data.password,
        confirmPassword: parsedBody.data.confirmPassword,
        ...(parsedBody.data.avatarUrl ? { avatarUrl: parsedBody.data.avatarUrl } : {}),
        ...(parsedBody.data.job ? { job: parsedBody.data.job } : {}),
      });

      response.status(201).json({
        data: registration,
      });
    } catch (error) {
      const errorResponse = toAuthErrorResponse(error instanceof AuthError ? error : undefined);
      response.status(errorResponse.statusCode).json(errorResponse.body);
    }
  };

  const validateLoginPayload: RequestHandler = (
    request: Request,
    response: Response<ApiErrorResponse>,
    next: NextFunction,
  ): void => {
    const parsedBody = loginSchema.safeParse(request.body);

    if (!parsedBody.success) {
      const errorResponse = toValidationErrorResponse(
        'Invalid login payload',
        parsedBody.error.flatten().fieldErrors,
      );
      response.status(errorResponse.statusCode).json(errorResponse.body);
      return;
    }

    request.body = parsedBody.data;
    next();
  };

  const me: RequestHandler = (
    request: Request,
    response: Response<ApiSuccessResponse<AuthSessionResponse>>,
  ): void => {
    response.status(200).json({
      data: {
        user: request.user ?? null,
      },
    });
  };

  const logout: RequestHandler = (request: Request, response: Response<ApiErrorResponse>): void => {
    request.logout((logoutError) => {
      if (logoutError) {
        response.status(500).json({
          error: {
            code: 'logout_failed',
            message: 'Could not complete logout',
          },
        });
        return;
      }

      request.session.destroy((sessionError) => {
        if (sessionError) {
          response.status(500).json({
            error: {
              code: 'logout_failed',
              message: 'Could not complete logout',
            },
          });
          return;
        }

        response.clearCookie('tracking_okrs.sid');
        response.status(204).send();
      });
    });
  };

  const resendVerificationEmail: RequestHandler = async (
    request: Request,
    response: Response<ApiSuccessResponse<ResendVerificationEmailResponse> | ApiErrorResponse>,
  ): Promise<void> => {
    const parsedBody = resendVerificationEmailSchema.safeParse(request.body);

    if (!parsedBody.success) {
      const errorResponse = toValidationErrorResponse(
        'Invalid resend verification payload',
        parsedBody.error.flatten().fieldErrors,
      );
      response.status(errorResponse.statusCode).json(errorResponse.body);
      return;
    }

    try {
      const resendState = await service.resendVerificationEmail(parsedBody.data.email);

      response.status(200).json({
        data: resendState,
      });
    } catch (error) {
      const errorResponse = toAuthErrorResponse(error instanceof AuthError ? error : undefined);
      response.status(errorResponse.statusCode).json(errorResponse.body);
    }
  };

  const verifyEmail: RequestHandler = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const rawToken = typeof request.query.token === 'string' ? request.query.token : '';

    try {
      await service.verifyEmailToken(rawToken);
      response.redirect(
        302,
        buildRedirectUrl(appOrigin, '/verify-email/result', {
          status: 'verified',
        }),
      );
    } catch (error) {
      const code =
        error instanceof AuthError ? error.code : AUTH_ERROR_CODES.invalidVerificationToken;
      const status = code === AUTH_ERROR_CODES.expiredVerificationToken ? 'expired' : 'invalid';

      response.redirect(
        302,
        buildRedirectUrl(appOrigin, '/verify-email/result', {
          status,
        }),
      );
    }
  };

  return {
    register,
    validateLoginPayload,
    me,
    logout,
    resendVerificationEmail,
    verifyEmail,
    toAuthErrorResponse,
    getGithubFailureRedirect(error?: AuthError | PassportFailureInfo | null): string {
      return buildRedirectUrl(appOrigin, '/login', {
        error: 'social_auth_failed',
        reason: getGithubFailureReason(error),
      });
    },
    getGithubSuccessRedirect(): string {
      return buildRedirectUrl(appOrigin, '/', {});
    },
  };
};

export const authController = createAuthController();
