<template>
  <q-page class="row q-col-gutter-md">
    <div class="col-12">
      <TimelineChart
        :events="timelineEvents"
        title="Transaction Timeline"
        yAxisLabel="Amount (€)"
        backgroundColor="rgba(75, 192, 192, 0.1)"
        borderColor="rgb(75, 192, 192)"
        :fillArea="true"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted} from 'vue';
import TimelineChart from 'src/components/chart/TimelineChart.vue';
import type { TimelineEvent } from 'src/components/chart/TimelineChart.vue';
import { datasource } from 'src/boot/di';

// Example timeline data - replace with your actual data
const timelineEvents = ref<TimelineEvent[]>([]);
onMounted(async () => {
    const res = await datasource.find("Transaction", {
      attributes: {
        date: {function: "date_trunc", params: [{value:"day"},"date"]},
        value: {function: "sum", params: ["total"]},
      },
      groupBy: [{ function: "date_trunc", params: [{value:"day"},"date"]}],
      orderBy: [[{function: "date_trunc", params: [{value:"day"},"date"]}, "desc"]],
      limit: 20
    });
    timelineEvents.value = res.map((t: { date: string; value: number }) => ({
        date: t.date,
        value: t.value,
        label: "date"
    }));
});
</script>