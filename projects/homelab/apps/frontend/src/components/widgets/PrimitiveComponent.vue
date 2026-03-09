<template>
  <span v-if="type === 'icon'">
    <img
      :src="String(value)"
      :alt="String(value)"
      style="max-height:24px; max-width: 100px;" />
  </span>
  <span v-else-if="type === 'boolean'" class="boolean">
    <q-icon :name="value ? 'check_circle' : 'cancel'" :color="value ? 'green' : 'red'" />
  </span>
  <span v-else-if="type === 'object'" class="object">
    <ObjectComponent v-if="typeof value === 'object' && value !== null"  :obj="value"/>
  </span>
  <span v-else-if="type === 'number'" class="number">
    {{ Number(value) }}
  </span>
  <span v-else-if="type === 'date'" class="date">
    {{ new Date(String(value)).toLocaleDateString() }}
  </span>
  <span v-else-if="type === 'datetime'" class="datetime">
    {{ new Date(String(value)).toLocaleString() }}
  </span>
  <span v-else-if="type === 'array' && Array.isArray(value)" class="array">
    <span>{{ (value as unknown[]).join(', ') }}</span>
  </span>
  <router-link v-else-if="type === 'link'" :to="String(value)" class="link">
      {{ label }}
  </router-link>
  <span v-else class="text">
      {{ value ?? label }}
  </span>
</template>
<script setup lang="ts">
import type { FieldType } from 'src/models/table';
import ObjectComponent from './ObjectComponent.vue';

defineProps<{
  value: unknown;
  type?: FieldType | undefined;
  label?: string | undefined;
}>();


</script>

<style scoped lang="scss">
.number{
  display: inline-block;
  min-width: 40px;
  text-align: right !important;
}
</style>
