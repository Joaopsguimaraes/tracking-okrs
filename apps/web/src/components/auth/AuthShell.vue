<script setup lang="ts">
defineProps<{
  eyebrow: string;
  title: string;
  description: string;
}>();
</script>

<template>
  <main class="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
    <section class="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <article
        class="overflow-hidden rounded-[calc(var(--radius)*1.6)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[0_24px_80px_rgba(35,38,30,0.12)]"
      >
        <div class="bg-[#234a31] px-8 py-10 text-white sm:px-10">
          <p class="text-xs font-semibold uppercase tracking-[0.32em] text-white/70">
            {{ eyebrow }}
          </p>
          <h1 class="mt-4 max-w-lg text-4xl font-semibold leading-tight sm:text-5xl">
            {{ title }}
          </h1>
          <p class="mt-4 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
            {{ description }}
          </p>
        </div>
        <div
          class="grid gap-4 border-t border-white/10 bg-[#f6f0e5] px-8 py-8 text-sm text-[#3f4336] sm:grid-cols-3 sm:px-10"
        >
          <div>
            <p class="font-semibold text-[#1f2e21]">
              Session-based access
            </p>
            <p class="mt-2 leading-6">
              The dashboard stays protected while the app resolves the current session.
            </p>
          </div>
          <div>
            <p class="font-semibold text-[#1f2e21]">
              Email verification
            </p>
            <p class="mt-2 leading-6">
              Local accounts can still confirm email ownership, without blocking access during this setup phase.
            </p>
          </div>
          <div>
            <p class="font-semibold text-[#1f2e21]">
              Mobile-ready forms
            </p>
            <p class="mt-2 leading-6">
              Forms, alerts and calls to action keep the same hierarchy across viewport sizes.
            </p>
          </div>
        </div>
      </article>

      <section
        class="rounded-[calc(var(--radius)*1.6)] border border-[var(--color-border)] bg-[rgba(255,250,242,0.92)] p-6 shadow-[0_16px_48px_rgba(35,38,30,0.1)] sm:p-8"
      >
        <slot />
      </section>
    </section>
  </main>
</template>
