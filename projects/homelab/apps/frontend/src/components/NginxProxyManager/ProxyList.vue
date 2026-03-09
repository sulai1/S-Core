<template>
	<TableComponent
    :data="hosts"
    :columns="[
      { headerName: 'Id', property: 'id', type: 'number', sortable: true },
      { headerName: 'Domain Names', property: (row) => row.domain_names.join(', '),
          cellClass: 'host_domain_names', sortable: true },
      { headerName: 'Forward Host', property: 'forward_host', sortable: true },
      { headerName: 'Forward Port', property: 'forward_port', type: 'number', sortable: true },
      { property: 'enabled', headerName:'Status' }
    ]"
    dense
  >
  <template #cell="{ value, columnName, row}">
    <span v-if="columnName === 'Status'">
      <LEDComponent  :value="{ name: 'Enabled', state: row['enabled'], label_on: 'Enabled', label_off: 'Disabled' }">
      </LEDComponent>
    </span>
    <span v-else>
      <PrimitiveComponent :value="value" :type="columnName === 'id' || columnName === 'Forward Port' ? 'number' : 'text'"/>
    </span>
  </template>
  </TableComponent>
</template>

<script setup lang="ts">
import { type OpenApiResult } from '@s-tek/api';
import { type paths } from '../../composables/useNpmApi';
import LEDComponent from '../widgets/LEDComponent.vue';
import TableComponent from '../widgets/TableComponent.vue';
import PrimitiveComponent from '../widgets/PrimitiveComponent.vue';
defineProps<{
	hosts: OpenApiResult<paths,"/nginx/proxy-hosts", "get">
}>()
</script>
