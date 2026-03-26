import { computed, onMounted, ref } from 'vue';

import { calculateProgressPercentage } from '@/models/okr-progress.model';
import { useSessionStore } from '@/stores/session.store';

export const useDashboardViewModel = () => {
  const sessionStore = useSessionStore();
  const completedKrs = ref(3);
  const totalKrs = ref(7);

  onMounted(async () => {
    await sessionStore.loadSession();
  });

  const overallProgress = computed(() =>
    calculateProgressPercentage({
      currentValue: completedKrs.value,
      targetValue: totalKrs.value,
    }),
  );

  return {
    sessionStore,
    overallProgress,
  };
};
