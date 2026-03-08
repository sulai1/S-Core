import { defineRouter } from '#q-app/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { routes as apiRoutes } from 'boot/di';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory);

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  // Authentication guard
  Router.beforeEach(async (to, _from, next) => {
    const requiresAuth = to.meta?.requiresAuth !== false;

    if (requiresAuth) {
      try {
        // Wait for apiRoutes to be initialized (loaded in boot)
        let attempts = 0;
        while (!apiRoutes['/auth/session'] && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 10));
          attempts++;
        }

        if (!apiRoutes['/auth/session']) {
          next('/login');
          return;
        }

        const data = await apiRoutes['/auth/session'].get();

        if (!data.authenticated) {
          next('/login');
          return;
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        next('/login');
        return;
      }
    }

    next();
  });

  return Router;
});
