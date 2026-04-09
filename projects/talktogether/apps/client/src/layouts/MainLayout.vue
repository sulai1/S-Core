<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat round dense icon="menu" aria-label="Menü" @click="toggleLeftDrawer" />

        <q-toolbar-title class="app-title cursor-pointer" @click="goDashboard">
          Talk Together
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered :width="220">
      <q-list padding>
        <q-item-label header>Navigation</q-item-label>

        <q-item
          v-for="item in navItems"
          :key="item.name"
          clickable
          v-ripple
          :active="route.name === item.name"
          active-class="bg-primary text-white"
          @click="router.push({ name: item.name })"
        >
          <q-item-section avatar>
            <q-icon :name="item.icon" />
          </q-item-section>
          <q-item-section>
            {{ item.label }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const leftDrawerOpen = ref(false);

const navItems = [
  { name: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { name: 'salesmen', label: 'Verkäufer', icon: 'groups' },
  { name: 'id', label: 'Ausweise', icon: 'badge' },
  { name: 'print', label: 'Drucken', icon: 'print' },
  { name: 'item', label: 'Artikel', icon: 'inventory_2' },
  { name: 'transaction', label: 'Transaktionen', icon: 'receipt_long' },
] as const;

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function goDashboard() {
  router.push({ name: 'dashboard' }).catch((e: unknown) => console.error(e));
}
</script>

<style scoped>
.app-title {
  user-select: none;
}
</style>
