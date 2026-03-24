<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>
          Talk Together
        </q-toolbar-title>
        <div class="q-gutter-sm flex justify-center items-center">
        <q-btn flat round dense label="Dashboard" @click="$router.push({name:'dashboard'})" />
        <q-btn flat round dense label="Verkäufer" @click="$router.push({name:'salesmen'})" />
        <q-btn flat round dense label="Ausweise" @click="$router.push({name:'id'})" />
        <q-btn flat round dense label="Artikel" @click="$router.push({name:'item'})" />
        <q-btn flat round dense label="Transaktionen" @click="$router.push({name:'transaction'})" />
        </div>
      </q-toolbar>
    </q-header>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">

</script>
