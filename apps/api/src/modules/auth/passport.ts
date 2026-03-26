import { Passport } from 'passport';
import type { Profile } from 'passport-github2';
import { Strategy as GithubStrategy } from 'passport-github2';
import type { IVerifyOptions } from 'passport-local';
import { Strategy as LocalStrategy } from 'passport-local';

import { env } from '../../config/env.js';
import { authRepository } from './repositories/auth.repository.js';
import { authService } from './services/auth.service.js';
import { AuthError } from './services/auth.errors.js';

type DoneCallback = (
  error: Error | null,
  user?: Express.User | false,
  info?: IVerifyOptions & {
    code?: string;
  },
) => void;

type PassportDependencies = {
  repository?: typeof authRepository;
  service?: typeof authService;
};

const toGithubProfileInput = (profile: Profile) => ({
  id: profile.id,
  ...(profile.username !== undefined
    ? {
        username: profile.username,
      }
    : {}),
  ...(profile.displayName
    ? {
        displayName: profile.displayName,
      }
    : {}),
  primaryEmail: profile.emails?.[0]?.value ?? null,
  avatarUrl: profile.photos?.[0]?.value ?? null,
});

export const createPassport = (dependencies: PassportDependencies = {}) => {
  const repository = dependencies.repository ?? authRepository;
  const service = dependencies.service ?? authService;
  const passport = new Passport();

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
        session: false,
      },
      async (email: string, password: string, done: DoneCallback) => {
        try {
          const user = await service.validateCredentials(email, password);
          done(null, user);
          return;
        } catch (error) {
          if (error instanceof AuthError) {
            done(null, false, {
              code: error.code,
              message: error.message,
            });
            return;
          }

          done(error instanceof Error ? error : new Error('Local authentication failed'));
        }
      },
    ),
  );

  passport.use(
    new GithubStrategy(
      {
        clientID: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        callbackURL: env.GITHUB_CALLBACK_URL,
        scope: ['user:email'],
      },
      async (_accessToken: string, _refreshToken: string, profile: Profile, done: DoneCallback) => {
        try {
          const user = await service.authenticateWithGithubProfile(toGithubProfileInput(profile));
          done(null, user);
          return;
        } catch (error) {
          if (error instanceof AuthError) {
            done(null, false, {
              code: error.code,
              message: error.message,
            });
            return;
          }

          done(error instanceof Error ? error : new Error('GitHub authentication failed'));
        }
      },
    ),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await repository.findUserById(id);
      done(null, user ?? false);
    } catch (error) {
      done(error as Error);
    }
  });

  return passport;
};

export const passport = createPassport();
