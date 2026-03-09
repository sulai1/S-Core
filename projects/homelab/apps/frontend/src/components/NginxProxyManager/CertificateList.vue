<template>
  <TableComponent
    :data="certificates"
    :columns="[
      { headerName: 'ID', property: 'id', sortable: true },
      { headerName: 'Domain Names', property: (row)=>{ return row.domain_names.join(', ') }, sortable: true },
      { headerName: 'Issuer', property: 'provider', sortable: true },
      { headerName: 'Expires On', property: 'expires_on', sortable: true, type: 'datetime' },
      { headerName: 'Expires In', property:(row) => countdown(row)},
      { headerName: 'Owner', property: (row)=>String(row.owner?.nickname ?? row.owner_user_id), sortable: true },
    ]"
    dense
  >
  </TableComponent>
</template>
<script setup lang="ts">
import { type OpenApiResult } from '@s-core/core';
import { type paths } from 'src/composables/useNpmApi';
import TableComponent from '../widgets/TableComponent.vue';
defineProps<{
  certificates:OpenApiResult<paths,"/nginx/certificates", "get">
}>();
function countdown(row:{ expires_on: string }) :string {
  const diff =  new Date(row.expires_on).getTime() - new Date().getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return `${days} days`;
  }
</script>
