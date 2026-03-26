import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { AuthSessionResponse } from '@tracking-okrs/shared-types';

import { useSessionStore } from '@/stores/session.store';

const { getSession } = vi.hoisted(() => ({
  getSession: vi.fn<() => Promise<AuthSessionResponse>>(),
}));

vi.mock('@/services/auth.service', () => ({
  authService: {
    getSession,
  },
}));

describe('session.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    getSession.mockReset();
  });

  it('loads and stores the current session user', async () => {
    getSession.mockResolvedValue({
      user: {
        id: 'user-1',
        username: 'ana',
        email: 'ana@example.com',
        name: 'Ana',
        avatarUrl: null,
        job: null,
        isVerified: true,
      },
    });

    const store = useSessionStore();

    await store.loadSession();

    expect(store.user?.email).toBe('ana@example.com');
    expect(store.hasLoaded).toBe(true);
    expect(store.isLoading).toBe(false);
  });

  it('clears session state explicitly', () => {
    const store = useSessionStore();
    store.setUser({
      id: 'user-1',
      username: 'ana',
      email: 'ana@example.com',
      name: 'Ana',
      avatarUrl: null,
      job: null,
      isVerified: true,
    });

    store.clearSession();

    expect(store.user).toBeNull();
    expect(store.hasLoaded).toBe(true);
  });
});
