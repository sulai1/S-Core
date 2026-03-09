<template>
  <q-page class="q-pa-md">
    <q-select
      v-model="label"
      :options="labels"
      label="Loki Labels"
    />
    {{ labels }}
    <h2>Loki {{ buildInfo?.version }}</h2>
    <div v-if="error" class="error">{{ error }}</div>
      <PieChart v-if="logByIp && logByIp.length"
        :labels="logByIp.map(item => item.ip) "
        :data=" logByIp.map(item => item.accesses) "
      ></PieChart>
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
    <div v-else-if="labels">
      <h3>Labels</h3>
      <ObjectComponent  v-if="res && 'data' in res && res.data.result"
       :obj="res.data.result" />
    </div>

  </q-page>
</template>
<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import useLokiApi, { type paths } from '../composables/useLoki';
  import { type OpenApiResult } from '@s-tek/api';
  import ObjectComponent from 'src/components/widgets/ObjectComponent.vue';
  import TableComponent from 'src/components/widgets/TableComponent.vue';
import PieChart from 'src/components/charts/PieChart.vue';

  const lokiApi = useLokiApi();
  const buildInfo = ref<OpenApiResult<paths,"/loki/api/v1/status/buildinfo", "get"> | null>(null);
  const error = ref<string | null>(null);
  const label = ref<string>();
  const labels = ref<string[]>();
  const logByIp = ref<{ip: string, accesses: number, timestamp: Date}[]>([]);
  const res = ref<OpenApiResult<paths,"/loki/api/v1/query_range", "get"> >();
  onMounted(async () => {
    try {
      labels.value = (await lokiApi.labels({})).data.data;
      console.log("Labels:", labels.value);
      buildInfo.value = (await lokiApi.buildInfo({})).data;
      res.value = (await lokiApi.queryRange({
        query: "topk(5, sum by(ip) (count_over_time({job=\"nginx-proxy-manager\"} | regexp `\\[Client (?P<ip>\\d+\\.\\d+\\.\\d+\\.\\d+)\\]` [1h])))",
        start: (Date.now() - 3600 * 1000) * 1e6,
        end: Date.now() * 1e6,
        step: "1h",
        limit: 1000,
      })).data;
      if (!res.value || !res.value.data || !res.value.data.result) {
        throw new Error("Invalid response from Loki queryRange");
      }
      logByIp.value = res.value.data.result.map((r) => {
        return {
          ip: (r as {metric: Record<string, string>}).metric?.['ip'] ?? 'unknown',
          accesses: r.values?.[0]?.[0] ? Number(r.values[0][1]) : 0,
          timestamp: r.values?.[0]?.[0] ? new Date(Number(r.values[0][0]) / 1e6) : new Date(0),
        };
      });
      logByIp.value.sort((a, b) => b.accesses - a.accesses);
    } catch (e) {
      error.value = (e as Error).message;
      console.error(error);
    }
  });
</script>
<style>
  .pie-chart {
    max-width: 600px;
    margin: auto;
  }
</style>
