import { computed, onBeforeUnmount, shallowRef } from 'vue';
import { useRouter } from 'vue-router';

import { parseApiError } from '@/lib/api-error';
import { verificationPendingState } from '@/lib/verification-pending-state';
import { authService } from '@/services/auth.service';

type PendingFeedback = {
  tone: 'success' | 'error' | 'info';
  title: string;
  description: string;
};

const getRemainingSeconds = (resendAvailableAt: string): number =>
  Math.max(0, Math.ceil((new Date(resendAvailableAt).getTime() - Date.now()) / 1000));

export const useVerifyEmailPendingViewModel = () => {
  const router = useRouter();
  const state = shallowRef(verificationPendingState.read());
  const isSubmitting = shallowRef(false);
  const feedback = shallowRef<PendingFeedback | null>(
    state.value?.deliveryStatus === 'pending_retry'
      ? {
          tone: 'error',
          title: 'Account created, but the verification email could not be delivered',
          description:
            'You can retry immediately from this screen without creating the account again.',
        }
      : null,
  );
  const remainingSeconds = shallowRef(
    state.value ? getRemainingSeconds(state.value.resendAvailableAt) : 0,
  );

  const syncRemainingSeconds = (): void => {
    remainingSeconds.value = state.value ? getRemainingSeconds(state.value.resendAvailableAt) : 0;
  };

  const intervalId = window.setInterval(syncRemainingSeconds, 1000);
  syncRemainingSeconds();

  onBeforeUnmount(() => {
    window.clearInterval(intervalId);
  });

  const redirectToRegister = async (): Promise<void> => {
    await router.replace({
      name: 'register',
    });
  };

  if (!state.value) {
    void redirectToRegister();
  }

  const resend = async (): Promise<void> => {
    if (!state.value || remainingSeconds.value > 0 || isSubmitting.value) {
      return;
    }

    isSubmitting.value = true;
    feedback.value = null;

    try {
      const response = await authService.resendVerificationEmail({
        email: state.value.email,
      });

      state.value = {
        email: state.value.email,
        resendAvailableAt: response.resendAvailableAt,
        deliveryStatus: response.deliveryStatus,
      };
      verificationPendingState.write(state.value);
      syncRemainingSeconds();

      feedback.value =
        response.deliveryStatus === 'sent'
          ? {
              tone: 'success',
              title: 'Verification email sent again',
              description: 'Use the newest email link to activate the account.',
            }
          : {
              tone: 'error',
              title: 'Verification email is still pending delivery',
              description:
                'The account is ready, but the email provider did not confirm delivery. Try again now or in a moment.',
            };
    } catch (error) {
      const parsedError = parseApiError(error);

      if (parsedError.code === 'cooldown_active' && parsedError.details?.resendAvailableAt) {
        state.value = {
          email: state.value.email,
          resendAvailableAt: parsedError.details.resendAvailableAt as string,
          deliveryStatus: state.value.deliveryStatus,
        };
        verificationPendingState.write(state.value);
        syncRemainingSeconds();
      }

      feedback.value = {
        tone: 'error',
        title: 'Could not resend the verification email',
        description: parsedError.message,
      };
    } finally {
      isSubmitting.value = false;
    }
  };

  const goToLogin = async (): Promise<void> => {
    await router.push({
      name: 'login',
    });
  };

  return {
    email: computed(() => state.value?.email ?? ''),
    hasState: computed(() => Boolean(state.value)),
    feedback,
    isSubmitting,
    canResend: computed(() => remainingSeconds.value === 0),
    remainingSeconds,
    resend,
    goToLogin,
  };
};
