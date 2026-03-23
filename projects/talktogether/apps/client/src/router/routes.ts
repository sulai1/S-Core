import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('pages/LoginPage.vue').catch((error) => {
      console.error('Failed to load LoginPage.vue:', error);
      return import('pages/ErrorNotFound.vue');
    }),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue').catch((error) => {
      console.error('Failed to load MainLayout.vue:', error);
      return import('pages/ErrorNotFound.vue');
    }),
    meta: { requiresAuth: true },
    children: [{
      path: '', name: "index", component: () => import('pages/IndexPage.vue').catch((error) => {
        console.error('Failed to load IndexPage.vue:', error);
        return import('pages/ErrorNotFound.vue');
      }),
    }, {
      path: 'salesmen', name: "salesmen", component: () => import('pages/SalesmanPage.vue').catch((error) => {
        console.error('Failed to load SalesmanPage.vue:', error);
        return import('pages/ErrorNotFound.vue');
      }),
    }, {
      path: 'id', name: "id", component: () => import('pages/IdPage.vue').catch((error) => {
        console.error('Failed to load IdPage.vue:', error);
        return import('pages/ErrorNotFound.vue');
      }),
    }, {
      path: 'item', name: "item", component: () => import('pages/ItemPage.vue').catch((error) => {
        console.error('Failed to load ItemPage.vue:', error);
        return import('pages/ErrorNotFound.vue');
      }),
    }, {
      path: 'transaction', name: "transaction", component: () => import('pages/TransactionPage.vue').catch((error) => {
        console.error('Failed to load TransactionPage.vue:', error);
        return import('pages/ErrorNotFound.vue');
      }),
    }],
  },

  // Always leave this as last one, 
  // but you can also remove it
  {
    path: '/:catchAll(.*)*', component: () => import('pages/ErrorNotFound.vue').catch((error) => {
      console.error('Failed to load ErrorNotFound.vue:', error);
      return import('pages/ErrorNotFound.vue');
    }),
  },
];

export default routes;
