import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthSessionResponse } from '@tracking-okrs/shared-types';
import { defineComponent } from 'vue';

import App from '@/App.vue';
import { createAppRouter, createMemoryHistory } from '@/router';
import { pinia } from '@/stores';
import { useSessionStore } from '@/stores/session.store';
import { useToastStore } from '@/stores/toast.store';
import { verificationPendingState } from '@/lib/verification-pending-state';
import { useLoginViewModel } from '@/view-models/login.view-model';

const { mockedGetSession, mockedLogin } = vi.hoisted(() => ({
  mockedGetSession: vi.fn<() => Promise<AuthSessionResponse>>(),
  mockedLogin: vi.fn(),
}));

vi.mock('@/services/auth.service', async () => {
  const actual =
    await vi.importActual<typeof import('@/services/auth.service')>('@/services/auth.service');

  return {
    authService: {
      ...actual.authService,
      getSession: mockedGetSession,
      login: mockedLogin,
    },
  };
});

const LoginHarness = defineComponent({
  setup() {
    return useLoginViewModel();
  },
  template: '<div />',
});

describe('LoginView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    useToastStore(pinia).$reset();
    useSessionStore(pinia).$reset();
  });

  it('shows a social login failure toast from callback query params', async () => {
    const router = createAppRouter({
      history: createMemoryHistory(),
      getSessionStore: () => ({
        user: null,
        hasLoaded: true,
        loadSession: () => Promise.resolve(),
      }),
    });

    await router.push('/login?error=social_auth_failed&reason=email_conflict');
    await router.isReady();

    const wrapper = mount(App, {
      global: {
        plugins: [pinia, router],
      },
    });

    await flushPromises();

    const toastStore = useToastStore();

    expect(toastStore.items).toHaveLength(1);
    expect(toastStore.items[0]?.title).toContain('Nao foi possivel realizar o login social');
    expect(toastStore.items[0]?.description).toContain('Ja existe uma conta com este email');

    wrapper.unmount();
  });

  it('shows the unverified account recovery path after login rejection', async () => {
    mockedLogin.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 403,
        data: {
          error: {
            code: 'email_not_verified',
            message: 'Email not verified',
          },
        },
      },
    });

    const router = createAppRouter({
      history: createMemoryHistory(),
      getSessionStore: () => ({
        user: null,
        hasLoaded: true,
        loadSession: () => Promise.resolve(),
      }),
    });

    await router.push('/login');
    await router.isReady();

    const wrapper = mount(LoginHarness, {
      global: {
        plugins: [pinia, router],
      },
    });

    wrapper.vm.email = 'ana@example.com';
    wrapper.vm.password = 'Secret#123';
    await wrapper.vm.submit();
    await flushPromises();

    expect(mockedLogin).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'Secret#123',
    });
    expect(wrapper.vm.feedback?.title).toBe('Verify your email before logging in');

    await wrapper.vm.navigateToVerificationPending();
    await flushPromises();

    const pendingState = verificationPendingState.read();

    expect(pendingState?.email).toBe('ana@example.com');
    expect(typeof pendingState?.resendAvailableAt).toBe('string');
    expect(pendingState?.deliveryStatus).toBe('sent');

    wrapper.unmount();
  });

  it('routes to the dashboard when login succeeds for an unverified account', async () => {
    mockedLogin.mockResolvedValue({
      user: {
        id: 'user-1',
        username: 'ana',
        email: 'ana@example.com',
        name: 'Ana',
        avatarUrl: null,
        job: null,
        isVerified: false,
      },
    });

    const router = createAppRouter({
      history: createMemoryHistory(),
    });

    await router.push('/login');
    await router.isReady();

    const wrapper = mount(LoginHarness, {
      global: {
        plugins: [pinia, router],
      },
    });

    wrapper.vm.email = 'ana@example.com';
    wrapper.vm.password = 'Strong#123';
    await wrapper.vm.submit();
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('dashboard');
    expect(useSessionStore(pinia).user?.isVerified).toBe(false);

    wrapper.unmount();
  });

  it('starts the GitHub login flow with the backend auth entrypoint', async () => {
    const previousLocation = window.location;
    const mockedLocation = {
      href: 'http://localhost/login',
    } as Location;

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: mockedLocation,
    });

    const router = createAppRouter({
      history: createMemoryHistory(),
      getSessionStore: () => ({
        user: null,
        hasLoaded: true,
        loadSession: () => Promise.resolve(),
      }),
    });

    await router.push('/login');
    await router.isReady();

    const wrapper = mount(LoginHarness, {
      global: {
        plugins: [pinia, router],
      },
    });

    wrapper.vm.loginWithGithub();

    expect(window.location.href).toBe('/api/v1/auth/github');

    wrapper.unmount();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: previousLocation,
    });
  });
});
