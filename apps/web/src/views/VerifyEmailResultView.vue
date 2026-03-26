<script setup lang="ts">
import AuthShell from '@/components/auth/AuthShell.vue';
import { useVerifyEmailResultViewModel } from '@/view-models/verify-email-result.view-model';

const { status, content, hasPendingState } = useVerifyEmailResultViewModel();
</script>

<template>
  <AuthShell
    description="Verification links resolve to stable routes with simple query params so the SPA can present deterministic success and recovery states."
    eyebrow="Verification"
    title="Resolve the final verification state."
  >
    <div class="flex flex-col gap-6">
      <div
        :class="
          status === 'verified'
            ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
            : 'border-amber-300 bg-amber-50 text-amber-950'
        "
        class="rounded-[var(--radius)] border px-5 py-4"
      >
        <p class="text-sm font-semibold uppercase tracking-[0.24em]">
          {{ status }}
        </p>
        <h2 class="mt-3 text-3xl font-semibold">
          {{ content.title }}
        </h2>
        <p class="mt-3 text-sm leading-6 opacity-85">
          {{ content.description }}
        </p>
      </div>

      <div class="grid gap-3">
        <RouterLink
          :to="status === 'verified' ? '/login' : '/verify-email/pending'"
          class="flex min-h-12 items-center justify-center rounded-[var(--radius)] bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary-foreground)] transition hover:opacity-90"
        >
          {{ content.primaryLabel }}
        </RouterLink>

        <RouterLink
          v-if="content.secondaryLabel"
          :to="status === 'expired' ? '/login' : hasPendingState ? '/login' : '/register'"
          class="flex min-h-12 items-center justify-center rounded-[var(--radius)] border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-[var(--color-foreground)] transition hover:border-[#234a31] hover:text-[#234a31]"
        >
          {{ content.secondaryLabel }}
        </RouterLink>
      </div>
    </div>
  </AuthShell>
</template>
