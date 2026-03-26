<script setup lang="ts">
import AppButton from '@/components/AppButton.vue';
import AuthShell from '@/components/auth/AuthShell.vue';
import { useRegisterViewModel } from '@/view-models/register.view-model';

const {
  username,
  usernameProps,
  email,
  emailProps,
  name,
  nameProps,
  password,
  passwordProps,
  confirmPassword,
  confirmPasswordProps,
  avatarUrl,
  avatarUrlProps,
  job,
  jobProps,
  errors,
  isSubmitting,
  passwordChecks,
  submit,
} = useRegisterViewModel();
</script>

<template>
  <AuthShell
    description="Create a local account with the required profile fields. Email verification can still be completed later without blocking access."
    eyebrow="Authentication"
    title="Create your account."
  >
    <div class="flex flex-col gap-6">
      <div>
        <p
          class="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-muted-foreground)]"
        >
          Register
        </p>
        <h2 class="mt-3 text-3xl font-semibold text-[var(--color-foreground)]">
          Start your workspace
        </h2>
      </div>

      <form
        class="grid gap-4"
        novalidate
        @submit.prevent="submit"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="flex flex-col gap-2">
            <span class="text-sm font-medium">Username</span>
            <input
              v-bind="usernameProps"
              v-model="username"
              autocomplete="username"
              class="rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#234a31] focus:ring-2 focus:ring-[#234a31]/15"
              name="username"
              placeholder="ana.souza"
              type="text"
            >
            <span
              v-if="errors.username"
              class="text-sm text-red-700"
            >
              {{ errors.username }}
            </span>
          </label>

          <label class="flex flex-col gap-2">
            <span class="text-sm font-medium">Full name</span>
            <input
              v-bind="nameProps"
              v-model="name"
              autocomplete="name"
              class="rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#234a31] focus:ring-2 focus:ring-[#234a31]/15"
              name="name"
              placeholder="Ana Souza"
              type="text"
            >
            <span
              v-if="errors.name"
              class="text-sm text-red-700"
            >
              {{ errors.name }}
            </span>
          </label>
        </div>

        <label class="flex flex-col gap-2">
          <span class="text-sm font-medium">Email</span>
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

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="flex flex-col gap-2">
            <span class="text-sm font-medium">Password</span>
            <input
              v-bind="passwordProps"
              v-model="password"
              autocomplete="new-password"
              class="rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#234a31] focus:ring-2 focus:ring-[#234a31]/15"
              name="password"
              placeholder="Create a password"
              type="password"
            >
            <span
              v-if="errors.password"
              class="text-sm text-red-700"
            >
              {{ errors.password }}
            </span>
          </label>

          <label class="flex flex-col gap-2">
            <span class="text-sm font-medium">Confirm password</span>
            <input
              v-bind="confirmPasswordProps"
              v-model="confirmPassword"
              autocomplete="new-password"
              class="rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#234a31] focus:ring-2 focus:ring-[#234a31]/15"
              name="confirmPassword"
              placeholder="Repeat the password"
              type="password"
            >
            <span
              v-if="errors.confirmPassword"
              class="text-sm text-red-700"
            >
              {{ errors.confirmPassword }}
            </span>
          </label>
        </div>

        <div class="rounded-[var(--radius)] border border-[var(--color-border)] bg-[#f8f4eb] p-4">
          <p class="text-sm font-semibold text-[var(--color-foreground)]">
            Password requirements
          </p>
          <ul class="mt-3 grid gap-2 text-sm text-[var(--color-muted-foreground)]">
            <li
              v-for="check in passwordChecks"
              :key="check.label"
              :class="check.isMet ? 'text-emerald-800' : 'text-[var(--color-muted-foreground)]'"
            >
              {{ check.isMet ? 'OK' : 'Pending' }} - {{ check.label }}
            </li>
          </ul>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="flex flex-col gap-2">
            <span class="text-sm font-medium">Avatar URL (optional)</span>
            <input
              v-bind="avatarUrlProps"
              v-model="avatarUrl"
              class="rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#234a31] focus:ring-2 focus:ring-[#234a31]/15"
              name="avatarUrl"
              placeholder="https://..."
              type="url"
            >
            <span
              v-if="errors.avatarUrl"
              class="text-sm text-red-700"
            >
              {{ errors.avatarUrl }}
            </span>
          </label>

          <label class="flex flex-col gap-2">
            <span class="text-sm font-medium">Job title (optional)</span>
            <input
              v-bind="jobProps"
              v-model="job"
              class="rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#234a31] focus:ring-2 focus:ring-[#234a31]/15"
              name="job"
              placeholder="Product manager"
              type="text"
            >
            <span
              v-if="errors.job"
              class="text-sm text-red-700"
            >
              {{ errors.job }}
            </span>
          </label>
        </div>

        <AppButton
          class-name="mt-2 min-h-12"
          :disabled="isSubmitting"
          type="submit"
        >
          {{ isSubmitting ? 'Creating account...' : 'Create account' }}
        </AppButton>
      </form>

      <p class="text-sm text-[var(--color-muted-foreground)]">
        Already registered?
        <RouterLink
          class="font-semibold text-[#234a31]"
          to="/login"
        >
          Sign in instead
        </RouterLink>
      </p>
    </div>
  </AuthShell>
</template>
