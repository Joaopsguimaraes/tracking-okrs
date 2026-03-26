<script setup lang="ts">
import AppButton from '@/components/AppButton.vue';
import AuthShell from '@/components/auth/AuthShell.vue';
import { useLoginViewModel } from '@/view-models/login.view-model';

const {
  email,
  emailProps,
  password,
  passwordProps,
  errors,
  isSubmitting,
  feedback,
  hasUnverifiedAccount,
  submit,
  loginWithGithub,
  navigateToVerificationPending,
} = useLoginViewModel();
</script>

<template>
  <AuthShell
    description="Use your email and password, or continue with GitHub. Email verification remains available as an extra account-confirmation step."
    eyebrow="Authentication"
    title="Sign in and resume your OKR workspace."
  >
    <div class="flex flex-col gap-6">
      <div>
        <p
          class="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-muted-foreground)]"
        >
          Login
        </p>
        <h2 class="mt-3 text-3xl font-semibold text-[var(--color-foreground)]">
          Welcome back
        </h2>
        <p class="mt-2 text-sm leading-6 text-[var(--color-muted-foreground)]">
          Local accounts can sign in normally while email verification is temporarily optional.
        </p>
      </div>

      <section
        v-if="feedback"
        class="rounded-[var(--radius)] border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        role="alert"
      >
        <p class="font-semibold">
          {{ feedback.title }}
        </p>
        <p class="mt-1 leading-6">
          {{ feedback.description }}
        </p>
        <AppButton
          v-if="hasUnverifiedAccount"
          class-name="mt-3 bg-amber-900 text-white"
          data-testid="open-verification-instructions"
          type="button"
          @click="navigateToVerificationPending"
        >
          Open verification instructions
        </AppButton>
      </section>

      <form
        class="flex flex-col gap-4"
        novalidate
        @submit.prevent="submit"
      >
        <label class="flex flex-col gap-2">
          <span class="text-sm font-medium text-[var(--color-foreground)]">Email</span>
          <input
            v-bind="emailProps"
            v-model="email"
            autocomplete="email"
            class="rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#234a31] focus:ring-2 focus:ring-[#234a31]/15"
            name="email"
            placeholder="you@company.com"
            type="email"
          >
          <span
            v-if="errors.email"
            class="text-sm text-red-700"
          >
            {{ errors.email }}
          </span>
        </label>

        <label class="flex flex-col gap-2">
          <span class="text-sm font-medium text-[var(--color-foreground)]">Password</span>
          <input
            v-bind="passwordProps"
            v-model="password"
            autocomplete="current-password"
            class="rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#234a31] focus:ring-2 focus:ring-[#234a31]/15"
            name="password"
            placeholder="Enter your password"
            type="password"
          >
          <span
            v-if="errors.password"
            class="text-sm text-red-700"
          >
            {{ errors.password }}
          </span>
        </label>

        <AppButton
          class-name="min-h-12"
          :disabled="isSubmitting"
          type="submit"
        >
          {{ isSubmitting ? 'Signing in...' : 'Sign in' }}
        </AppButton>
      </form>

      <div class="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div class="h-px bg-[var(--color-border)]" />
        <span
          class="text-center text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]"
        >
          or
        </span>
        <div class="h-px bg-[var(--color-border)]" />
      </div>

      <button
        class="flex min-h-12 items-center justify-center rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-foreground)] transition hover:border-[#234a31] hover:text-[#234a31]"
        data-testid="github-login"
        type="button"
        @click="loginWithGithub"
      >
        Continue with GitHub
      </button>

      <p class="text-sm text-[var(--color-muted-foreground)]">
        New here?
        <RouterLink
          class="font-semibold text-[#234a31]"
          to="/register"
        >
          Create an account
        </RouterLink>
      </p>
    </div>
  </AuthShell>
</template>
