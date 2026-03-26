import passport from 'passport';
import type { Profile } from 'passport-github2';
import { Strategy as GithubStrategy } from 'passport-github2';
import { Strategy as LocalStrategy } from 'passport-local';

import { env } from '../../config/env.js';
import { authRepository } from './repositories/auth.repository.js';
import { authService } from './services/auth.service.js';

type DoneCallback = (error: Error | null, user?: Express.User | false) => void;

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email: string, password: string, done: DoneCallback) => {
      try {
        const user = await authService.validateCredentials(email, password);
        done(null, user ?? false);
        return;
      } catch (error) {
        done(error instanceof Error ? error : new Error('Local authentication failed'));
        return;
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
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: DoneCallback,
    ) => {
      try {
        const primaryEmail = profile.emails?.[0]?.value ?? profile.username;

        if (!primaryEmail) {
          done(new Error('GitHub profile does not expose a usable email'));
          return;
        }

        const existingUser = await authRepository.findUserByGithubId(profile.id);

        if (existingUser) {
          done(null, existingUser);
          return;
        }

        const displayName =
          profile.displayName.length > 0 ? profile.displayName : primaryEmail;

        const createdUser = await authRepository.createGithubUser({
          githubId: profile.id,
          email: primaryEmail,
          displayName,
          avatarUrl: profile.photos?.[0]?.value ?? null,
        });

        done(null, createdUser);
        return;
      } catch (error) {
        done(error instanceof Error ? error : new Error('GitHub authentication failed'));
        return;
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await authRepository.findUserById(id);
    done(null, user ?? false);
  } catch (error) {
    done(error);
  }
});

export { passport };
