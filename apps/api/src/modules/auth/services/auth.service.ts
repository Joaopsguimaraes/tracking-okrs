import argon2 from 'argon2';

import type { AuthUser } from '@tracking-okrs/shared-types';

import { authRepository } from '../repositories/auth.repository.js';

export const authService = {
  async validateCredentials(email: string, password: string): Promise<AuthUser | null> {
    const user = await authRepository.findUserByEmail(email);

    if (!user?.passwordHash) {
      return null;
    }

    const isValid = await argon2.verify(user.passwordHash, password);

    if (!isValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    };
  },
};
