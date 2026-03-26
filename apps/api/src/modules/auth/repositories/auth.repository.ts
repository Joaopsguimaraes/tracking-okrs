import type { AuthUser } from '@tracking-okrs/shared-types';

import { query } from '../../../db/query.js';

type UserRow = {
  id: string;
  email: string;
  display_name: string;
  password_hash: string | null;
  avatar_url: string | null;
};

type AuthAccountRow = {
  user_id: string;
};

export const authRepository = {
  async findUserByEmail(email: string): Promise<(AuthUser & { passwordHash: string | null }) | null> {
    const rows = await query<UserRow>(
      `
        select id, email, display_name, password_hash, avatar_url
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
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      passwordHash: user.password_hash,
    };
  },

  async findUserById(id: string): Promise<AuthUser | null> {
    const rows = await query<UserRow>(
      `
        select id, email, display_name, password_hash, avatar_url
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
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
    };
  },

  async findUserByGithubId(githubId: string): Promise<AuthUser | null> {
    const rows = await query<UserRow & AuthAccountRow>(
      `
        select u.id, u.email, u.display_name, u.password_hash, u.avatar_url, aa.user_id
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
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
    };
  },

  async createGithubUser(input: {
    email: string;
    displayName: string;
    avatarUrl: string | null;
    githubId: string;
  }): Promise<AuthUser> {
    const userRows = await query<UserRow>(
      `
        insert into users (email, display_name, avatar_url)
        values ($1, $2, $3)
        returning id, email, display_name, password_hash, avatar_url
      `,
      [input.email, input.displayName, input.avatarUrl],
    );

    const user = userRows[0];

    if (!user) {
      throw new Error('Could not create user');
    }

    await query(
      `
        insert into auth_accounts (user_id, provider, provider_user_id)
        values ($1, 'github', $2)
      `,
      [user.id, input.githubId],
    );

    return {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
    };
  },
};
