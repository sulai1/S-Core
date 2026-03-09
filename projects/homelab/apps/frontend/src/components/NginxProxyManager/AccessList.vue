<!-- <template>
  <TableComponent
    :data="access_list"
    :columns="[
      { headerName: 'ID', property: 'expires_on', sortable: true },
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
  access_list:OpenApiResult<paths,"/nginx/access-lists", "get">
}>();
function countdown(row:{ expires_on: string }) :string {
  const diff =  new Date(row.expires_on).getTime() - new Date().getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return `${days} days`;
  }
</script> -->
