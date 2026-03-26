import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from '@/App.vue';
import { verificationPendingState } from '@/lib/verification-pending-state';
import { createAppRouter, createMemoryHistory } from '@/router';
import { pinia } from '@/stores';
import { useToastStore } from '@/stores/toast.store';

const { mockedGetSession } = vi.hoisted(() => ({
  mockedGetSession: vi.fn(),
}));

vi.mock('@/services/auth.service', async () => {
  const actual =
    await vi.importActual<typeof import('@/services/auth.service')>('@/services/auth.service');

  return {
    authService: {
      ...actual.authService,
      getSession: mockedGetSession,
    },
  };
});

describe('VerifyEmailResultView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    useToastStore(pinia).$reset();
  });

  it('renders the expired verification state', async () => {
    const router = createAppRouter({
      history: createMemoryHistory(),
      getSessionStore: () => ({
        user: null,
        hasLoaded: true,
        loadSession: () => Promise.resolve(),
      }),
    });

    await router.push('/verify-email/result?status=expired');
    await router.isReady();

    const wrapper = mount(App, {
      global: {
        plugins: [pinia, router],
      },
    });

    expect(wrapper.text()).toContain('Verification link expired');
    expect(wrapper.text()).toContain('Request a new verification email');
  });

  it('clears the stored pending state after a verified result', async () => {
    verificationPendingState.write({
      email: 'ana@example.com',
      resendAvailableAt: '2026-03-26T12:00:45.000Z',
      deliveryStatus: 'sent',
    });

    const router = createAppRouter({
      history: createMemoryHistory(),
      getSessionStore: () => ({
        user: null,
        hasLoaded: true,
        loadSession: () => Promise.resolve(),
      }),
    });

    await router.push('/verify-email/result?status=verified');
    await router.isReady();

    const wrapper = mount(App, {
      global: {
        plugins: [pinia, router],
      },
    });

    expect(wrapper.text()).toContain('Email verified');
    expect(verificationPendingState.read()).toBeNull();
  });

  it('keeps the recovery path for invalid links when pending state exists', async () => {
    verificationPendingState.write({
      email: 'ana@example.com',
      resendAvailableAt: '2026-03-26T12:00:45.000Z',
      deliveryStatus: 'pending_retry',
    });

    const router = createAppRouter({
      history: createMemoryHistory(),
      getSessionStore: () => ({
        user: null,
        hasLoaded: true,
        loadSession: () => Promise.resolve(),
      }),
    });

    await router.push('/verify-email/result?status=invalid');
    await router.isReady();

    const wrapper = mount(App, {
      global: {
        plugins: [pinia, router],
      },
    });

    expect(wrapper.text()).toContain('Verification link is invalid');
    expect(wrapper.text()).toContain('Open resend screen');
    expect(wrapper.html()).toContain('/login');
  });
});
