import type { NextFunction, Request, RequestHandler, Response } from 'express';

import type { ApiSuccessResponse, AuthSessionResponse } from '@tracking-okrs/shared-types';

import { loginSchema } from '../schemas/auth.schemas.js';

const login: RequestHandler = (request: Request, response: Response, next: NextFunction): void => {
    const parsedBody = loginSchema.safeParse(request.body);

    if (!parsedBody.success) {
      response.status(400).json({
        error: {
          code: 'validation_error',
          message: 'Invalid login payload',
          details: parsedBody.error.flatten().fieldErrors,
        },
      });
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

const logout: RequestHandler = (request: Request, response: Response): void => {
  request.logout((error) => {
    if (error) {
      response.status(500).json({
        error: {
          code: 'logout_failed',
          message: 'Could not complete logout',
        },
      });
      return;
    }

    request.session.destroy(() => {
      response.status(204).send();
    });
  });
};

type AuthController = {
  login: RequestHandler;
  me: RequestHandler;
  logout: RequestHandler;
};

export const authController: AuthController = {
  login,
  me,
  logout,
};
