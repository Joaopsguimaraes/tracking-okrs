import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';

import { verificationPendingState } from '@/lib/verification-pending-state';

type VerificationResultStatus = 'verified' | 'invalid' | 'expired';

const normalizeStatus = (value: string | null | undefined): VerificationResultStatus => {
  if (value === 'verified' || value === 'expired') {
    return value;
  }

  return 'invalid';
};

export const useVerifyEmailResultViewModel = () => {
  const route = useRoute();
  const pendingState = verificationPendingState.read();

  const status = computed(() =>
    normalizeStatus(typeof route.query.status === 'string' ? route.query.status : null),
  );

  watch(
    status,
    (currentStatus) => {
      if (currentStatus === 'verified') {
        verificationPendingState.clear();
      }
    },
    {
      immediate: true,
    },
  );

  const content = computed(() => {
    switch (status.value) {
      case 'verified':
        return {
          title: 'Email verified',
          description:
            'Your account is now ready. Continue to login and start using the dashboard.',
          primaryLabel: 'Go to login',
          secondaryLabel: null,
        };
      case 'expired':
        return {
          title: 'Verification link expired',
          description: 'Request a new verification email and use the most recent link.',
          primaryLabel: 'Open resend screen',
          secondaryLabel: 'Back to login',
        };
      default:
        return {
          title: 'Verification link is invalid',
          description: 'The link may have already been used or does not match an active token.',
          primaryLabel: 'Open resend screen',
          secondaryLabel: 'Create account again',
        };
    }
  });

  return {
    status,
    content,
    hasPendingState: computed(() => Boolean(pendingState?.email)),
  };
};
