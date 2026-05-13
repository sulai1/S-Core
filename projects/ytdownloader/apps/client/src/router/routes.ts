import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        component: () => import('layouts/MainLayout.vue'),
        children: [
            { path: '', redirect: '/download' },
            { path: 'download', component: () => import('pages/DownloadPage.vue') },
            { path: 'channels', component: () => import('pages/ChannelOverviewPage.vue') },
            { path: 'sync', component: () => import('pages/SyncPage.vue') },
            { path: 'jobs', component: () => import('pages/JobsPage.vue') },
            { path: 'library', component: () => import('pages/LibraryPage.vue') },
            { path: 'settings', component: () => import('pages/SettingsPage.vue') },
        ],
    },
    {
        path: '/:catchAll(.*)*',
        component: () => import('pages/ErrorNotFound.vue'),
    },
];

export default routes;
