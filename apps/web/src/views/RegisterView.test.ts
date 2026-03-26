import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import type { RegisterResponse } from '@tracking-okrs/shared-types';

import { createAppRouter, createMemoryHistory } from '@/router';
import { pinia } from '@/stores';
import { useRegisterViewModel } from '@/view-models/register.view-model';

const { mockedRegister } = vi.hoisted(() => ({
  mockedRegister: vi.fn<(input: Record<string, unknown>) => Promise<RegisterResponse>>(),
}));

vi.mock('@/services/auth.service', async () => {
  const actual =
    await vi.importActual<typeof import('@/services/auth.service')>('@/services/auth.service');

  return {
    authService: {
      ...actual.authService,
      register: mockedRegister,
    },
  };
});

const Harness = defineComponent({
  setup() {
    return useRegisterViewModel();
  },
  template: '<div />',
});

describe('RegisterView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
  });

  it('redirects to login after successful registration', async () => {
    mockedRegister.mockResolvedValue({
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

    await router.push('/register');
    await router.isReady();

    const wrapper = mount(Harness, {
      global: {
        plugins: [pinia, router],
      },
    });

    wrapper.vm.username = 'ana';
    wrapper.vm.email = 'ana@example.com';
    wrapper.vm.name = 'Ana';
    wrapper.vm.password = 'Strong#123';
    wrapper.vm.confirmPassword = 'Strong#123';

    await wrapper.vm.submit();
    await flushPromises();

    expect(mockedRegister).toHaveBeenCalledWith({
      username: 'ana',
      email: 'ana@example.com',
      name: 'Ana',
      password: 'Strong#123',
      confirmPassword: 'Strong#123',
    });
    expect(router.currentRoute.value.name).toBe('login');

    wrapper.unmount();
  });
});
