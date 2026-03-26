import { defineStore } from 'pinia';

import type { AuthUser } from '@tracking-okrs/shared-types';

import { authService } from '@/services/auth.service';

type SessionState = {
  user: AuthUser | null;
  isLoading: boolean;
};

export const useSessionStore = defineStore('session', {
  state: (): SessionState => ({
    user: null,
    isLoading: false,
  }),
  actions: {
    async loadSession(): Promise<void> {
      this.isLoading = true;

      try {
        const session = await authService.getSession();
        this.user = session.user;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
