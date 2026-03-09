<template>
  <TableComponent
    v-if="logByIp"
    :columns="[
      { property: 'ip', headerName: 'IP Address' },
      { property: 'accesses', headerName: 'Accesses' },
      { property: 'timestamp', headerName: 'Timestamp', type: 'date' },
    ]"
    :data="logByIp"
    dense
    />
</template>

<script setup lang="ts">
  import TableComponent from 'src/components/widgets/TableComponent.vue';
  defineProps<{
    logByIp: {ip: string, accesses: number, timestamp: Date}[] | undefined;
  }>();

</script>
