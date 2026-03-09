<template>
  <img :src="svg" alt="logo" class="brand-logo" />
</template>

<script setup lang="ts">
import svg from 'src/assets/digital-money_4896246.svg?inline';
</script>

<style scoped lang="scss">
.brand-logo {
  height: 44px;
  width: auto;
  object-fit: contain;
  transition: all 0.3s ease;
  margin: 6px 6px;
  padding: 3px;
  border:3px solid $primary;
  border-radius: 20%;
}
</style>
