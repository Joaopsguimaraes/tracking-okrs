import {
  createMemoryHistory,
  createRouter,
  createWebHistory,
  type RouterHistory,
} from 'vue-router';

import DashboardView from '@/views/DashboardView.vue';
import LoginView from '@/views/LoginView.vue';
import RegisterView from '@/views/RegisterView.vue';
import VerifyEmailPendingView from '@/views/VerifyEmailPendingView.vue';
import VerifyEmailResultView from '@/views/VerifyEmailResultView.vue';
import { pinia } from '@/stores';
import { useSessionStore } from '@/stores/session.store';

type SessionStoreLike = Pick<
  ReturnType<typeof useSessionStore>,
  'user' | 'hasLoaded' | 'loadSession'
>;

type RouterDependencies = {
  history?: RouterHistory;
  getSessionStore?: () => SessionStoreLike;
};

export const createAppRouter = (dependencies: RouterDependencies = {}) => {
  const history = dependencies.history ?? createWebHistory();
  const getSessionStore = dependencies.getSessionStore ?? (() => useSessionStore(pinia));

  const router = createRouter({
    history,
    routes: [
      {
        path: '/',
        name: 'dashboard',
        component: DashboardView,
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: '/login',
        name: 'login',
        component: LoginView,
        meta: {
          publicOnly: true,
        },
      },
      {
        path: '/register',
        name: 'register',
        component: RegisterView,
        meta: {
          publicOnly: true,
        },
      },
      {
        path: '/verify-email/pending',
        name: 'verify-email-pending',
        component: VerifyEmailPendingView,
      },
      {
        path: '/verify-email/result',
        name: 'verify-email-result',
        component: VerifyEmailResultView,
      },
    ],
  });

  router.beforeEach(async (to) => {
    const sessionStore = getSessionStore();

    if (!sessionStore.hasLoaded) {
      await sessionStore.loadSession();
    }

    if (to.meta.requiresAuth && !sessionStore.user) {
      return {
        name: 'login',
      };
    }

    if (to.meta.publicOnly && sessionStore.user) {
      return {
        name: 'dashboard',
      };
    }

    return true;
  });

  return router;
};

export const router = createAppRouter();
export { createMemoryHistory };
