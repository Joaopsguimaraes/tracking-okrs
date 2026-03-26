import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import type { ResendVerificationEmailResponse } from '@tracking-okrs/shared-types';

import { createAppRouter, createMemoryHistory } from '@/router';
import { pinia } from '@/stores';
import { useToastStore } from '@/stores/toast.store';
import { useVerifyEmailPendingViewModel } from '@/view-models/verify-email-pending.view-model';
import { verificationPendingState } from '@/lib/verification-pending-state';

const { mockedResendVerificationEmail } = vi.hoisted(() => ({
  mockedResendVerificationEmail:
    vi.fn<(input: { email: string }) => Promise<ResendVerificationEmailResponse>>(),
}));

vi.mock('@/services/auth.service', async () => {
  const actual =
    await vi.importActual<typeof import('@/services/auth.service')>('@/services/auth.service');

  return {
    authService: {
      ...actual.authService,
      resendVerificationEmail: mockedResendVerificationEmail,
    },
  };
});

const Harness = defineComponent({
  setup() {
    return useVerifyEmailPendingViewModel();
  },
  template: '<div />',
});

describe('verify-email-pending.view-model', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-26T12:00:00.000Z'));
    vi.clearAllMocks();
    window.sessionStorage.clear();
    useToastStore(pinia).$reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('unlocks resend after the cooldown expires and refreshes the stored state', async () => {
    verificationPendingState.write({
      email: 'ana@example.com',
      resendAvailableAt: '2026-03-26T12:00:45.000Z',
      deliveryStatus: 'sent',
    });
    mockedResendVerificationEmail.mockResolvedValue({
      resendAvailableAt: '2026-03-26T12:01:45.000Z',
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

    await router.push('/verify-email/pending');
    await router.isReady();

    const wrapper = mount(Harness, {
      global: {
        plugins: [pinia, router],
      },
    });

    expect(wrapper.vm.canResend).toBe(false);
    expect(wrapper.vm.remainingSeconds).toBe(45);

    vi.advanceTimersByTime(45_000);
    await flushPromises();

    expect(wrapper.vm.canResend).toBe(true);

    await wrapper.vm.resend();
    await flushPromises();

    expect(mockedResendVerificationEmail).toHaveBeenCalledWith({
      email: 'ana@example.com',
    });
    expect(verificationPendingState.read()).toEqual({
      email: 'ana@example.com',
      resendAvailableAt: '2026-03-26T12:01:45.000Z',
      deliveryStatus: 'sent',
    });
  });
});
