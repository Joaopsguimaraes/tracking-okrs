import {
  Router,
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from 'express';
import type { IVerifyOptions } from 'passport-local';

import {
  authController,
  createAuthController,
} from '../modules/auth/controllers/auth.controller.js';
import { passport } from '../modules/auth/passport.js';

type PassportAuthenticateCallback = (
  error: Error | null,
  user?: Express.User | false,
  info?: IVerifyOptions & { code?: string },
) => void;

type PassportAuthenticator = {
  authenticate(
    strategy: string,
    options?: Record<string, unknown>,
    callback?: PassportAuthenticateCallback,
  ): RequestHandler;
};

type AuthRouterDependencies = {
  authenticator?: PassportAuthenticator;
  controller?: ReturnType<typeof createAuthController>;
};

const completeLogin =
  (
    controller: ReturnType<typeof createAuthController>,
    authenticator: PassportAuthenticator,
  ): RequestHandler =>
  (request: Request, response: Response, next: NextFunction): void => {
    const authenticate = authenticator.authenticate(
      'local',
      { session: false },
      (error, user, info) => {
        if (error) {
          next(error);
          return;
        }

        if (!user) {
          const errorResponse = controller.toAuthErrorResponse(info);
          response.status(errorResponse.statusCode).json(errorResponse.body);
          return;
        }

        request.logIn(user, (loginError) => {
          if (loginError) {
            next(loginError);
            return;
          }

          response.status(200).json({
            data: {
              user: request.user ?? null,
            },
          });
        });
      },
    );

    authenticate(request, response, next);
  };

const completeGithubCallback =
  (
    controller: ReturnType<typeof createAuthController>,
    authenticator: PassportAuthenticator,
  ): RequestHandler =>
  (request: Request, response: Response, next: NextFunction): void => {
    const authenticate = authenticator.authenticate(
      'github',
      { session: false },
      (error, user, info) => {
        if (error) {
          response.redirect(302, controller.getGithubFailureRedirect());
          return;
        }

        if (!user) {
          response.redirect(302, controller.getGithubFailureRedirect(info));
          return;
        }

        request.logIn(user, (loginError) => {
          if (loginError) {
            next(loginError);
            return;
          }

          response.redirect(302, controller.getGithubSuccessRedirect());
        });
      },
    );

    authenticate(request, response, next);
  };

export const createAuthRouter = (dependencies: AuthRouterDependencies = {}): Router => {
  const authenticator =
    dependencies.authenticator ?? (passport as unknown as PassportAuthenticator);
  const controller = dependencies.controller ?? authController;
  const authRouter = Router();

  authRouter.post('/register', controller.register);
  authRouter.post(
    '/login',
    controller.validateLoginPayload,
    completeLogin(controller, authenticator),
  );
  authRouter.post('/logout', controller.logout);
  authRouter.get('/me', controller.me);
  authRouter.get(
    '/github',
    authenticator.authenticate('github', { session: true, scope: ['user:email'] }),
  );
  authRouter.get('/github/callback', completeGithubCallback(controller, authenticator));
  authRouter.get('/verify-email', controller.verifyEmail);
  authRouter.post('/resend-verification', controller.resendVerificationEmail);

  return authRouter;
};

export const authRouter: Router = createAuthRouter();
