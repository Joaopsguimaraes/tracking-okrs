import { defineStore } from 'pinia';

import type { AuthUser } from '@tracking-okrs/shared-types';

import { authService } from '@/services/auth.service';

type SessionState = {
  user: AuthUser | null;
  isLoading: boolean;
  hasLoaded: boolean;
};

let loadSessionPromise: Promise<void> | null = null;

export const useSessionStore = defineStore('session', {
  state: (): SessionState => ({
    user: null,
    isLoading: false,
    hasLoaded: false,
  }),
  actions: {
    async loadSession(force = false): Promise<void> {
      if (this.hasLoaded && !force) {
        return;
      }

      if (loadSessionPromise) {
        return loadSessionPromise;
      }

      this.isLoading = true;

      loadSessionPromise = (async () => {
        try {
          const session = await authService.getSession();
          this.user = session.user;
        } catch {
          this.user = null;
        } finally {
          this.isLoading = false;
          this.hasLoaded = true;
          loadSessionPromise = null;
        }
      })();

      return loadSessionPromise;
    },

    setUser(user: AuthUser | null): void {
      this.user = user;
      this.hasLoaded = true;
    },

    clearSession(): void {
      this.user = null;
      this.isLoading = false;
      this.hasLoaded = true;
    },
  },
});
