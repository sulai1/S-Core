<template>
  <q-layout view="lHh Lpr lFf" class="main-layout">
    <div class="background-container">
      <div class="gradient-accent"></div>
    </div>

    <q-header
    >
      <q-toolbar>
        <div class="brand-container">
          <q-btn v-show="!leftDrawerOpen"
            flat dense
            round icon="menu"
            aria-label="Menu"
            class="menu-btn"
            @click="toggleLeftDrawer" />
          <BrandLogo
            @click="toggleLeftDrawer"
          />
          <div class="brand-text">
            Homelab
          </div>
        </div>

        <q-space />
        <div class="header-actions">
          <q-btn flat dense rounded icon="account_circle" aria-label="Profile" class="profile" >
            <span class="profile">
              Profile
            </span>
          </q-btn>
        </div>
      </q-toolbar>
      <div class="q-neon-header"></div>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="drawer">
      <div class="row">
        <TreeView :nodes="linksList" :show-labels="false" class="sidebar"/>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          class="menu-btn"
          style="position: absolute; top: 8px; right: 8px; z-index: 1;"
          @click="toggleLeftDrawer"
        />
      </div>
    </q-drawer>
    <q-page-container class="page-container">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import BrandLogo from 'src/components/BrandLogo.vue';
import type { TreeNode } from 'src/components/widgets/TreeView.vue';
import TreeView from 'src/components/widgets/TreeView.vue';
import { ref } from 'vue';

const linksList: TreeNode[] =[
  { data: '/', icon: 'home', label: 'Home', type: "link" },
  {
    data: "Services",
    icon: 'apps',
    collapsible: false,
    children: [
      // { data: 'dashboard', icon: 'dashboard', label: 'Dashboard', type: "link" },
      { label: 'Nginx Proxy Manager', icon: 'settings', data: "proxy-manager", type: "link" },
      { label: 'Loki', icon: 'assignment', data: "loki", type: "link" },
    ],
  },
  { data: 'about', icon: 'info', label: 'About', type: "link" },
];

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

</script>

<style scoped lang="scss">

$main-text-color: rgb(235, 94, 40);

.main-layout {
  position: relative;
}

.page-container {
  position: relative;
  min-height: 100vh;
}

.main-layout,
.main-layout * {
  color: rgb(255, 252, 242) !important;
}

.background-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background: linear-gradient(135deg, rgb(64, 61, 57) 0%, rgb(37, 36, 34) 100%);
  overflow: hidden;

  &::before,
  &::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.3;
    pointer-events: none;
  }

  &::before {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, $primary 0%, transparent 70%);
    animation: float-primary 25s ease-in-out infinite;
  }

  &::after {
    width: 450px;
    height: 450px;
    background: radial-gradient(circle, $secondary 0%, transparent 70%);
    animation: float-secondary 30s ease-in-out infinite;
  }
}

.background-container > * {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  pointer-events: none;
}

.gradient-accent {
  width: 550px;
  height: 550px;
  background: radial-gradient(circle, $accent 0%, transparent 70%);
  animation: float-accent 28s ease-in-out infinite;
}

.q-header {
  transition: all 0.3s ease;
  background: rgba(37, 36, 34, .7 ) !important;
  height:60px;
}

.q-neon-header {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, transparent 0%, $primary 50%, transparent 100%);
  background-size: 200% 100%;
  pointer-events: none;
  animation: gradient-slide 30s ease-in-out infinite;
  box-shadow: 0 0 5px $primary;
}
@keyframes gradient-slide {
  0% { background-position: -200% 0; }
  50% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

:deep(.q-drawer) {
  background: rgba($dark,0.3) !important;
  backdrop-filter: blur(10px);
}

.q-toolbar {
  transition: all 0.3s ease;
  min-height: inherit;
  padding: 0 16px;
  background: transparent !important;
}

.brand-container {
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
}


.brand-text {
  font-size: 1.5rem;
  font-weight: 600;
  color: $main-text-color;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.menu-btn {
  margin-right: 8px;
  color: $main-text-color ;
}


.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}


:deep(.profile .q-icon) {
  color: $primary !important;
}

.sidebar {
  margin-top: 36px;
  margin-left: 16px;
}

@media (max-width: 600px) {
  .header-top {
    height: 44px;
  }

  .brand-logo {
    height: 40px;
  }
}

@keyframes float-primary {
  0% { transform: translate(10%, 20%); }
  25% { transform: translate(80%, 30%); }
  50% { transform: translate(70%, 70%); }
  75% { transform: translate(20%, 80%); }
  100% { transform: translate(10%, 20%); }
}

@keyframes float-secondary {
  0% { transform: translate(70%, 10%); }
  25% { transform: translate(20%, 40%); }
  50% { transform: translate(30%, 80%); }
  75% { transform: translate(85%, 60%); }
  100% { transform: translate(70%, 10%); }
}

@keyframes float-accent {
  0% { transform: translate(40%, 60%); }
  25% { transform: translate(10%, 15%); }
  50% { transform: translate(80%, 20%); }
  75% { transform: translate(50%, 85%); }
  100% { transform: translate(40%, 60%); }
}
</style>
