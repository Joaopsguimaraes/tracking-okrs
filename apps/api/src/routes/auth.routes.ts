import { Router, type RequestHandler } from 'express';
import passport from 'passport';

import { authController } from '../modules/auth/controllers/auth.controller.js';

export const authRouter: Router = Router();

const authenticateLocal = passport.authenticate('local') as RequestHandler;
const authenticateGithub = passport.authenticate('github', { session: true }) as RequestHandler;
const authenticateGithubCallback = passport.authenticate('github', {
  failureRedirect: '/login',
  session: true,
}) as RequestHandler;

authRouter.post(
  '/login',
  authController.login,
  authenticateLocal,
  authController.me,
);

authRouter.post('/logout', authController.logout);
authRouter.get('/me', authController.me);
authRouter.get('/github', authenticateGithub);
authRouter.get(
  '/github/callback',
  authenticateGithubCallback,
  (_request, response) => {
    response.redirect('/');
  },
);
