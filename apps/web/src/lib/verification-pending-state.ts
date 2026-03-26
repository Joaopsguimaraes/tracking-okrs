export type VerificationPendingState = {
  email: string;
  resendAvailableAt: string;
  deliveryStatus: 'sent' | 'pending_retry';
};

const STORAGE_KEY = 'tracking-okrs.verify-email-pending';

export const verificationPendingState = {
  read(): VerificationPendingState | null {
    const rawValue = window.sessionStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawValue) as Partial<VerificationPendingState>;

      if (!parsed.email || !parsed.resendAvailableAt) {
        return null;
      }

      return {
        email: parsed.email,
        resendAvailableAt: parsed.resendAvailableAt,
        deliveryStatus: parsed.deliveryStatus === 'pending_retry' ? 'pending_retry' : 'sent',
      };
    } catch {
      return null;
    }
  },

  write(input: VerificationPendingState): void {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(input));
  },

  clear(): void {
    window.sessionStorage.removeItem(STORAGE_KEY);
  },
};
