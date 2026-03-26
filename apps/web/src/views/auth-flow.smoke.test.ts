/* eslint-disable vue/one-component-per-file */
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import type { AuthSessionResponse, RegisterResponse } from '@tracking-okrs/shared-types';

import { createAppRouter, createMemoryHistory } from '@/router';
import { pinia } from '@/stores';
import { useSessionStore } from '@/stores/session.store';
import { useToastStore } from '@/stores/toast.store';
import { useLoginViewModel } from '@/view-models/login.view-model';
import { useRegisterViewModel } from '@/view-models/register.view-model';

const { mockedGetSession, mockedRegister, mockedLogin } = vi.hoisted(() => ({
  mockedGetSession: vi.fn<() => Promise<AuthSessionResponse>>(),
  mockedRegister: vi.fn<(input: Record<string, unknown>) => Promise<RegisterResponse>>(),
  mockedLogin: vi.fn<(input: Record<string, unknown>) => Promise<AuthSessionResponse>>(),
}));

vi.mock('@/services/auth.service', async () => {
  const actual = await vi.importActual<typeof import('@/services/auth.service')>(
    '@/services/auth.service',
  );

  return {
    authService: {
      ...actual.authService,
      getSession: mockedGetSession,
      register: mockedRegister,
      login: mockedLogin,
    },
  };
});

const RegisterHarness = defineComponent({
  setup() {
    return useRegisterViewModel();
  },
  template: '<div />',
});

const LoginHarness = defineComponent({
  setup() {
    return useLoginViewModel();
  },
  template: '<div />',
});

describe('authentication flow smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    useToastStore(pinia).$reset();
    useSessionStore(pinia).$reset();

    mockedGetSession.mockResolvedValue({
      user: null,
    });
  });

  it('executes register and login together without requiring prior email verification', async () => {
    mockedRegister.mockResolvedValue({
      email: 'ana@example.com',
      resendAvailableAt: '2026-03-26T12:00:00.000Z',
      deliveryStatus: 'sent',
    });
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

    await router.push('/register');
    await router.isReady();

    const registerWrapper = mount(RegisterHarness, {
      global: {
        plugins: [pinia, router],
      },
    });

    registerWrapper.vm.username = 'ana';
    registerWrapper.vm.email = 'ana@example.com';
    registerWrapper.vm.name = 'Ana';
    registerWrapper.vm.password = 'Strong#123';
    registerWrapper.vm.confirmPassword = 'Strong#123';
    await registerWrapper.vm.submit();
    await flushPromises();

    expect(mockedRegister).toHaveBeenCalledWith({
      username: 'ana',
      email: 'ana@example.com',
      name: 'Ana',
      password: 'Strong#123',
      confirmPassword: 'Strong#123',
    });
    expect(router.currentRoute.value.name).toBe('login');

    registerWrapper.unmount();

    const loginWrapper = mount(LoginHarness, {
      global: {
        plugins: [pinia, router],
      },
    });

    loginWrapper.vm.email = 'ana@example.com';
    loginWrapper.vm.password = 'Strong#123';
    await loginWrapper.vm.submit();
    await flushPromises();

    expect(mockedLogin).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'Strong#123',
    });
    expect(router.currentRoute.value.name).toBe('dashboard');
    expect(useSessionStore(pinia).user?.name).toBe('Ana');
    expect(useSessionStore(pinia).user?.isVerified).toBe(false);

    loginWrapper.unmount();
  });
});
