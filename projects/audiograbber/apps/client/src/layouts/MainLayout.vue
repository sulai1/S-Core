<template>
  <q-layout view="hHh lpR fFf" class="ag-layout">
    <q-header bordered class="ag-header">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" />
        <q-toolbar-title class="brand-title">AudioGrabber Control Room</q-toolbar-title>
        <q-chip
          v-if="authState.required && authState.authenticated"
          color="teal-9"
          text-color="white"
          icon="verified_user"
        >
          {{ authState.username ?? 'signed-in' }}
        </q-chip>
        <q-btn
          v-if="authState.required && authState.authenticated"
          flat
          dense
          icon="logout"
          label="Logout"
          @click="onLogout"
        />
        <q-chip color="black" text-color="amber-4" icon="podcasts">Phase 4 MVP</q-chip>
        <q-chip
          v-if="ytDlpInfo"
          :color="ytDlpInfo.upToDate ? 'green-9' : 'orange-9'"
          text-color="white"
          :icon="ytDlpInfo.upToDate ? 'check_circle' : 'warning'"
          :title="ytDlpInfo.upToDate ? 'yt-dlp is up to date' : `Latest: ${ytDlpInfo.latestVersion}`"
          dense
        >
          yt-dlp {{ ytDlpInfo.version }}
        </q-chip>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="ag-drawer">
      <q-list>
        <q-item-label header class="drawer-header">Workflows</q-item-label>

        <q-item v-for="item in navItems" :key="item.to" :to="item.to" clickable v-ripple>
          <q-item-section avatar>
            <q-icon :name="item.icon" />
          </q-item-section>
          <q-item-section>{{ item.label }}</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition appear enter-active-class="animated fadeInUp">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { authState, logoutWithKeycloak } from 'src/auth/keycloak';
import { apiClient } from 'boot/api';

const leftDrawerOpen = ref(true);

type YtDlpInfo = { version: string; latestVersion: string; upToDate: boolean };
const ytDlpInfo = ref<YtDlpInfo | null>(null);

const onLogout = async (): Promise<void> => {
  await logoutWithKeycloak();
};

const navItems = [
  { to: '/download', label: 'Download', icon: 'download' },
  { to: '/channels', label: 'Channel Overview', icon: 'video_library' },
  { to: '/sync', label: 'Sync', icon: 'sync' },
  { to: '/jobs', label: 'Jobs', icon: 'manage_history' },
  { to: '/library', label: 'Library', icon: 'library_music' },
  { to: '/settings', label: 'Settings', icon: 'tune' },
];

onMounted(async () => {
  try {
    const { data } = await apiClient.get<{ ytDlp: YtDlpInfo }>('/system/info');
    ytDlpInfo.value = data.ytDlp;
  } catch {
    // not critical — leave chip hidden
  }
});
</script>
