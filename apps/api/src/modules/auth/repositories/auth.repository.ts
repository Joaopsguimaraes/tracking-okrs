import type { AuthUser } from '@tracking-okrs/shared-types';

import { query } from '../../../db/query.js';
import type {
  AuthRepository,
  CreateEmailVerificationTokenInput,
  CreateGithubUserInput,
  CreateLocalUserInput,
  AuthUserRecord,
  EmailVerificationTokenRecord,
} from '../types/auth.types.js';

type UserRow = {
  id: string;
  username: string;
  email: string;
  name: string;
  password_hash: string | null;
  avatar_url: string | null;
  job: string | null;
  is_verified: boolean;
};

type AuthAccountRow = {
  user_id: string;
  provider_email: string | null;
};

type EmailVerificationTokenRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date | string;
  sent_at: Date | string;
  used_at: Date | string | null;
};

export const authRepository: AuthRepository = {
  async findUserByEmail(email: string): Promise<AuthUserRecord | null> {
    const rows = await query<UserRow>(
      `
        select id, username, email, name, password_hash, avatar_url, job, is_verified
        from users
        where email = $1
        limit 1
      `,
      [email],
    );

    const user = rows[0];

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
      job: user.job,
      isVerified: user.is_verified,
      passwordHash: user.password_hash,
    };
  },

  async findUserByUsername(username: string): Promise<AuthUser | null> {
    const rows = await query<UserRow>(
      `
        select id, username, email, name, password_hash, avatar_url, job, is_verified
        from users
        where username = $1
        limit 1
      `,
      [username],
    );

    const user = rows[0];

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
      job: user.job,
      isVerified: user.is_verified,
    };
  },

  async findUserById(id: string): Promise<AuthUser | null> {
    const rows = await query<UserRow>(
      `
        select id, username, email, name, password_hash, avatar_url, job, is_verified
        from users
        where id = $1
        limit 1
      `,
      [id],
    );

    const user = rows[0];

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
      job: user.job,
      isVerified: user.is_verified,
    };
  },

  async findUserByGithubId(githubId: string): Promise<AuthUser | null> {
    const rows = await query<UserRow & AuthAccountRow>(
      `
        select u.id, u.username, u.email, u.name, u.password_hash, u.avatar_url, u.job,
               u.is_verified, aa.user_id, aa.provider_email
        from auth_accounts aa
        inner join users u on u.id = aa.user_id
        where aa.provider = 'github'
          and aa.provider_user_id = $1
        limit 1
      `,
      [githubId],
    );

    const user = rows[0];

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
      job: user.job,
      isVerified: user.is_verified,
    };
  },

  async createLocalUser(input: CreateLocalUserInput): Promise<AuthUserRecord> {
    const userRows = await query<UserRow>(
      `
        insert into users (username, email, name, password_hash, avatar_url, job, is_verified)
        values ($1, $2, $3, $4, $5, $6, false)
        returning id, username, email, name, password_hash, avatar_url, job, is_verified
      `,
      [input.username, input.email, input.name, input.passwordHash, input.avatarUrl, input.job],
    );

    const user = userRows[0];

    if (!user) {
      throw new Error('Could not create local user');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
      job: user.job,
      isVerified: user.is_verified,
      passwordHash: user.password_hash,
    };
  },

  async createGithubUser(input: CreateGithubUserInput): Promise<AuthUser> {
    const userRows = await query<UserRow>(
      `
        insert into users (username, email, name, avatar_url, job, is_verified)
        values ($1, $2, $3, $4, $5, true)
        returning id, username, email, name, password_hash, avatar_url, job, is_verified
      `,
      [input.username, input.email, input.name, input.avatarUrl, input.job],
    );

    const user = userRows[0];

    if (!user) {
      throw new Error('Could not create user');
    }

    await query(
      `
        insert into auth_accounts (user_id, provider, provider_user_id, provider_email)
        values ($1, 'github', $2, $3)
      `,
      [user.id, input.githubId, input.providerEmail],
    );

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
      job: user.job,
      isVerified: user.is_verified,
    };
  },

  async createEmailVerificationToken(input: CreateEmailVerificationTokenInput): Promise<void> {
    await query(
      `
        insert into email_verification_tokens (user_id, token_hash, expires_at, sent_at)
        values ($1, $2, $3, coalesce($4::timestamptz, now()))
      `,
      [input.userId, input.tokenHash, input.expiresAt, input.sentAt ?? null],
    );
  },

  async findEmailVerificationTokenByHash(
    tokenHash: string,
  ): Promise<EmailVerificationTokenRecord | null> {
    const rows = await query<EmailVerificationTokenRow>(
      `
        select id, user_id, token_hash, expires_at, sent_at, used_at
        from email_verification_tokens
        where token_hash = $1
        limit 1
      `,
      [tokenHash],
    );

    const token = rows[0];

    if (!token) {
      return null;
    }

    return {
      id: token.id,
      userId: token.user_id,
      tokenHash: token.token_hash,
      expiresAt: new Date(token.expires_at).toISOString(),
      sentAt: new Date(token.sent_at).toISOString(),
      usedAt: token.used_at ? new Date(token.used_at).toISOString() : null,
    };
  },

  async findLatestEmailVerificationTokenByUserId(
    userId: string,
  ): Promise<EmailVerificationTokenRecord | null> {
    const rows = await query<EmailVerificationTokenRow>(
      `
        select id, user_id, token_hash, expires_at, sent_at, used_at
        from email_verification_tokens
        where user_id = $1
          and used_at is null
        order by sent_at desc
        limit 1
      `,
      [userId],
    );

    const token = rows[0];

    if (!token) {
      return null;
    }

    return {
      id: token.id,
      userId: token.user_id,
      tokenHash: token.token_hash,
      expiresAt: new Date(token.expires_at).toISOString(),
      sentAt: new Date(token.sent_at).toISOString(),
      usedAt: token.used_at ? new Date(token.used_at).toISOString() : null,
    };
  },

  async consumeEmailVerificationToken(tokenHash: string): Promise<boolean> {
    const rows = await query<EmailVerificationTokenRow>(
      `
        update email_verification_tokens
        set used_at = now()
        where token_hash = $1
          and used_at is null
        returning id, user_id, token_hash, expires_at, sent_at, used_at
      `,
      [tokenHash],
    );

    return rows.length > 0;
  },

  async invalidateEmailVerificationTokensForUser(userId: string): Promise<void> {
    await query(
      `
        update email_verification_tokens
        set used_at = coalesce(used_at, now())
        where user_id = $1
          and used_at is null
      `,
      [userId],
    );
  },

  async markUserAsVerified(userId: string): Promise<void> {
    await query(
      `
        update users
        set is_verified = true
        where id = $1
      `,
      [userId],
    );
  },
};
