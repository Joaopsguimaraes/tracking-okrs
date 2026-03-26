<script setup lang="ts">
import AppButton from '@/components/AppButton.vue';
import AuthShell from '@/components/auth/AuthShell.vue';
import { useVerifyEmailPendingViewModel } from '@/view-models/verify-email-pending.view-model';

const { hasState, email, feedback, canResend, isSubmitting, remainingSeconds, resend, goToLogin } =
  useVerifyEmailPendingViewModel();
</script>

<template>
  <AuthShell
    description="This screen stays available without an authenticated session so users can review the email address, wait for the cooldown and request a fresh message when needed."
    eyebrow="Verification"
    title="Check your inbox to activate the account."
  >
    <div
      v-if="hasState"
      class="flex flex-col gap-6"
    >
      <div>
        <p
          class="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-muted-foreground)]"
        >
          Pending verification
        </p>
        <h2 class="mt-3 text-3xl font-semibold text-[var(--color-foreground)]">
          We sent a verification link
        </h2>
        <p class="mt-3 text-sm leading-6 text-[var(--color-muted-foreground)]">
          The account for
          <span class="font-semibold text-[var(--color-foreground)]">{{ email }}</span>
          can still complete email confirmation here whenever you want to activate that extra check.
        </p>
      </div>

      <section
        v-if="feedback"
        :class="
          feedback.tone === 'success'
            ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
            : 'border-red-300 bg-red-50 text-red-950'
        "
        class="rounded-[var(--radius)] border px-4 py-3 text-sm"
        role="status"
      >
        <p class="font-semibold">
          {{ feedback.title }}
        </p>
        <p class="mt-1 leading-6">
          {{ feedback.description }}
        </p>
      </section>

      <div class="rounded-[var(--radius)] border border-[var(--color-border)] bg-[#f8f4eb] p-5">
        <p class="text-sm font-semibold text-[var(--color-foreground)]">
          Next steps
        </p>
        <ol class="mt-3 grid gap-2 text-sm leading-6 text-[var(--color-muted-foreground)]">
          <li>1. Open the newest verification email.</li>
          <li>2. Use the link within 24 hours.</li>
          <li>3. Return here only if the message never arrives or the link expires.</li>
        </ol>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row">
        <AppButton
          class-name="min-h-12 sm:flex-1"
          data-testid="resend-verification"
          :disabled="!canResend || isSubmitting"
          type="button"
          @click="resend"
        >
          {{
            canResend
              ? isSubmitting
                ? 'Resending...'
                : 'Resend verification email'
              : `Resend available in ${remainingSeconds}s`
          }}
        </AppButton>
        <button
          class="min-h-12 rounded-[var(--radius)] border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-[var(--color-foreground)] transition hover:border-[#234a31] hover:text-[#234a31] sm:flex-1"
          type="button"
          @click="goToLogin"
        >
          Back to login
        </button>
      </div>
    </div>
  </AuthShell>
</template>
