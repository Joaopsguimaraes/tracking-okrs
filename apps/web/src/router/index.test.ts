import { describe, expect, it, vi } from 'vitest';

import { createAppRouter, createMemoryHistory } from '@/router';

describe('router guards', () => {
  it('redirects protected routes to login when there is no session', async () => {
    const store = {
      user: null,
      hasLoaded: true,
      loadSession: () => Promise.resolve(),
    };

    const router = createAppRouter({
      history: createMemoryHistory(),
      getSessionStore: () => store,
    });

    await router.push('/');

    expect(router.currentRoute.value.name).toBe('login');
  });

  it('redirects auth-only public routes to dashboard when already authenticated', async () => {
    const store = {
      user: {
        id: 'user-1',
        username: 'ana',
        email: 'ana@example.com',
        name: 'Ana',
        avatarUrl: null,
        job: null,
        isVerified: true,
      },
      hasLoaded: true,
      loadSession: () => Promise.resolve(),
    };

    const router = createAppRouter({
      history: createMemoryHistory(),
      getSessionStore: () => store,
    });

    await router.push('/login');

    expect(router.currentRoute.value.name).toBe('dashboard');
  });

  it('loads session once before the first guarded navigation', async () => {
    const store = {
      user: null,
      hasLoaded: false,
      loadSession: vi.fn<() => Promise<void>>(() => {
        store.hasLoaded = true;
        return Promise.resolve();
      }),
    };

    const router = createAppRouter({
      history: createMemoryHistory(),
      getSessionStore: () => store,
    });

    await router.push('/');
    await router.push('/verify-email/pending');

    expect(store.loadSession).toHaveBeenCalledTimes(1);
    expect(router.currentRoute.value.name).toBe('verify-email-pending');
  });
});
