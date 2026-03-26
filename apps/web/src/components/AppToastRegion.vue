<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { useToastStore } from '@/stores/toast.store';

const toastStore = useToastStore();
const { items } = storeToRefs(toastStore);

const toneClassMap = {
  error: 'border-red-300 bg-red-50 text-red-950',
  success: 'border-emerald-300 bg-emerald-50 text-emerald-950',
  info: 'border-slate-300 bg-white text-slate-950',
} as const;
</script>

<template>
  <div
    aria-live="polite"
    class="pointer-events-none fixed inset-x-0 top-4 z-50 mx-auto flex max-w-xl flex-col gap-3 px-4"
  >
    <article
      v-for="item in items"
      :key="item.id"
      :class="toneClassMap[item.tone]"
      class="pointer-events-auto rounded-[var(--radius)] border px-4 py-3 shadow-lg"
      role="status"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-sm font-semibold">
            {{ item.title }}
          </p>
          <p
            v-if="item.description"
            class="mt-1 text-sm opacity-80"
          >
            {{ item.description }}
          </p>
        </div>
        <button
          class="rounded-full px-2 py-1 text-xs font-semibold opacity-70 transition hover:opacity-100"
          type="button"
          @click="toastStore.remove(item.id)"
        >
          Close
        </button>
      </div>
    </article>
  </div>
</template>
