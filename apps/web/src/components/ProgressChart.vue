<template>
  <div
    class="h-72 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4"
  >
    <Bar
      :data="chartData"
      :options="chartOptions"
    />
  </div>
</template>

<script setup lang="ts">
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { Bar } from 'vue-chartjs';
import { computed } from 'vue';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const props = defineProps<{
  progressPercentage: number;
}>();

const chartData = computed(() => ({
  labels: ['Quarter Progress'],
  datasets: [
    {
      label: 'Completion %',
      data: [props.progressPercentage],
      backgroundColor: ['#166534'],
      borderRadius: 10,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
    },
  },
};
</script>
