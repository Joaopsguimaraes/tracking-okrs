import { defineStore } from 'pinia';

type ToastTone = 'error' | 'success' | 'info';

export type ToastItem = {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastState = {
  items: ToastItem[];
  nextId: number;
};

export const useToastStore = defineStore('toast', {
  state: (): ToastState => ({
    items: [],
    nextId: 1,
  }),
  actions: {
    push(input: Omit<ToastItem, 'id'>): number {
      const id = this.nextId;
      this.nextId += 1;

      this.items.push({
        id,
        ...input,
      });

      window.setTimeout(() => {
        this.remove(id);
      }, 5000);

      return id;
    },

    remove(id: number): void {
      this.items = this.items.filter((item) => item.id !== id);
    },
  },
});
