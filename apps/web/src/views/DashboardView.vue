<template>
  <main class="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10">
    <section class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div
        class="rounded-[calc(var(--radius)*1.4)] border border-[var(--color-border)] bg-[var(--color-card)] p-8"
      >
        <p class="text-sm uppercase tracking-[0.24em] text-[var(--color-muted-foreground)]">
          Quarter snapshot
        </p>
        <h1 class="mt-3 max-w-xl text-4xl font-bold text-[var(--color-foreground)]">
          Track every key result, progress signal and supporting document in one place.
        </h1>
        <p class="mt-4 max-w-2xl text-base text-[var(--color-muted-foreground)]">
          The workspace is ready for quarters, objectives, key results, dashboards and rich
          documents attached to each KR.
        </p>
        <div class="mt-6 flex items-center gap-4">
          <AppButton>Configure first quarter</AppButton>
          <span class="text-sm text-[var(--color-muted-foreground)]">
            Session:
            {{ sessionStore.user?.name ?? 'not authenticated yet' }}
          </span>
        </div>
      </div>

      <div
        class="rounded-[calc(var(--radius)*1.4)] border border-[var(--color-border)] bg-[#204229] p-8 text-white"
      >
        <p class="text-sm uppercase tracking-[0.24em] text-white/70">
          Current completion
        </p>
        <p class="mt-4 text-6xl font-bold">
          {{ overallProgress }}%
        </p>
        <p class="mt-3 text-sm text-white/70">
          Placeholder metric sourced from the frontend model layer and ready for API wiring.
        </p>
      </div>
    </section>

    <section class="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <ProgressChart :progress-percentage="overallProgress" />
      <div
        class="rounded-[var(--radius)] border border-dashed border-[var(--color-border)] bg-white/60 p-6"
      >
        <h2 class="text-lg font-semibold">
          MVVM folders are in place
        </h2>
        <p class="mt-2 text-sm text-[var(--color-muted-foreground)]">
          Put business rules in `models`, screen orchestration in `view-models`, Pinia stores in
          `stores` and API adapters in `services`.
        </p>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import AppButton from '@/components/AppButton.vue';
import ProgressChart from '@/components/ProgressChart.vue';
import { useDashboardViewModel } from '@/view-models/dashboard.view-model';

const { overallProgress, sessionStore } = useDashboardViewModel();
</script>
