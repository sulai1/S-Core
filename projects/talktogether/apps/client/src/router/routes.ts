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
      path: '', name: "dashboard", component: () => import('pages/IndexPage.vue').catch((error) => {
        console.error('Failed to load IndexPage.vue:', error);
        return import('pages/ErrorNotFound.vue');
      }),
    }, {
      path: 'salesmen', name: "salesmen", component: () => import('pages/SalesmanPage.vue').catch((error) => {
        console.error('Failed to load SalesmanPage.vue:', error);
        return import('pages/ErrorNotFound.vue');
      }),
    }, {
      path: 'sales', name: "sales", component: () => import('pages/SalesPage.vue').catch((error) => {
        console.error('Failed to load SalesPage.vue:', error);
        return import('pages/ErrorNotFound.vue');
      }),
    }, {
      path: 'id', name: "id", component: () => import('pages/IdPage.vue').catch((error) => {
        console.error('Failed to load IdPage.vue:', error);
        return import('pages/ErrorNotFound.vue');
      }),
    }, {
      path: 'print', name: "print", component: () => import('pages/PrintPage.vue').catch((error) => {
        console.error('Failed to load PrintPage.vue:', error);
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
    }, {
      path: 'invoice', name: "invoice", component: () => import('pages/InvoicePage.vue').catch((error) => {
        console.error('Failed to load InvoicePage.vue:', error);
        return import('pages/ErrorNotFound.vue');
      }),
    }, {
      path: 'invoices', name: "invoices", component: () => import('pages/InvoiceListPage.vue').catch((error) => {
        console.error('Failed to load InvoiceListPage.vue:', error);
        return import('pages/ErrorNotFound.vue');
      }),
    }, {
      path: 'invoice/:id', name: "invoice-detail", component: () => import('pages/InvoiceDetailPage.vue').catch((error) => {
        console.error('Failed to load InvoiceDetailPage.vue:', error);
        return import('pages/ErrorNotFound.vue');
      }),
    }, {
      path: 'salesmen/:id', name: "salesman-detail", component: () => import('pages/SalesmanDetailPage.vue').catch((error) => {
        console.error('Failed to load SalesmanDetailPage.vue:', error);
        return import('pages/ErrorNotFound.vue');
      }),
    }, {
      path: 'edit-salesman/:id', name: "edit-salesman", component: () => import('pages/EditSalesmanPage.vue').catch((error) => {
        console.error('Failed to load EditSalesmanPage.vue:', error);
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
