<template>
  <button
    :class="
      cn(
        'inline-flex items-center justify-center rounded-[var(--radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55',
        props.className,
      )
    "
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils';

const props = defineProps<{
  className?: string;
}>();
</script>
