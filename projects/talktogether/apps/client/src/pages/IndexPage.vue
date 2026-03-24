<template>
  <q-page class="q-col-gutter-md">
    <div class = "row">
      <q-input v-model="validFrom" label="Gültig von" dense outlined class="q-mb-md" type="date"
        :rules="[ val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val) || 'Ungültiges Datumsformat (YYYY-MM-DD)']"
      />
      <q-input v-model="validTo" label="Gültig bis" dense outlined class="q-mb-md" type="date"
        :rules="[ val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val) || 'Ungültiges Datumsformat (YYYY-MM-DD)']"
      />
    </div>
    <div class="row">
      <div class="col-4">
        <TimelineChart
          :data="timelineSeries"
          title="Verkauf"
          yAxisLabel="Betrag (€)"
          backgroundColor="rgba(75, 192, 192, 0.1)"
          borderColor="rgb(75, 192, 192)"
          :fillArea="true"
        />
      </div>
      <div class="col-3">
        <q-card class="my-card" style="height:100%">
          <q-card-section>
            <div class="text-h6">Zeitungen</div>
            <TableComponent
              :columns="[{ headerName: 'Name', property: 'name' }, 
              { headerName: 'Verkauf', property: 'pos', cellClass: () => 'text-positive' }, 
              { headerName: 'Einkauf', property: 'neg', cellClass: () => 'text-negative'}, 
              { headerName: 'Gewinn', property: 'diff' }]"
              :data="newsPaperStats"
              style="overflow: hidden;"
            ></TableComponent>

          </q-card-section>
        </q-card>
      </div>
      <div class="col-5">
        <ScrollableBarChart
          :data="barChartData"
          title="Gewinn pro Eintrag"
          axisLabel="Gewinn"
          :visibleBars="6"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref,  watch} from 'vue';
import TimelineChart from 'src/components/chart/TimelineChart.vue';
import type {  TimelineSeries } from 'src/components/chart/TimelineChart.vue';
import ScrollableBarChart from 'src/components/chart/ScrollableBarChart.vue';
import type { BarChartItem } from 'src/components/chart/ScrollableBarChart.vue';
import { datasource } from 'src/boot/di';
import TableComponent from 'src/components/TableComponent.vue';

// Example timeline data - replace with your actual data
const timelineSeries = ref<TimelineSeries[]>([]);
const newsPaperStats = ref<{ name:string, pos:number, neg:number, diff:number}[]>([]);
const barChartData = computed<BarChartItem[]>(() => {
  return newsPaperStats.value.map((entry) => {
    const isPositive = entry.diff >= 0;
    return {
      label: entry.name,
      value: entry.diff,
      backgroundColor: isPositive ? 'rgba(75, 192, 192, 0.45)' : 'rgba(255, 99, 132, 0.45)',
      borderColor: isPositive ? 'rgb(75, 192, 192)' : 'rgb(255, 99, 132)',
    };
  });
});
const validFrom = ref<string>(new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().substring(0, 10));
const validTo = ref<string>(new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().substring(0, 10));
watch([validFrom, validTo], async () => {

    const currentIssue = await datasource.find("Item", {
      attributes: {
        id: "id",
        name:"name",
        quantity:"quantity",
      },
      where:[
        {function: "between", params: ["validTo", {value: validFrom.value}, {value: validTo.value}]}
      ]
    });  
    console.log("Current issue:", currentIssue);
    const timelineData: TimelineSeries[] = [];
    const newsPaperData: { name:string, pos:number, neg:number, diff:number}[] = [];
    for (const item of currentIssue) {
      const transactionData = await datasource.find("Transaction", {
        attributes: {
          date: {function: "date_trunc", params: [{value:"day"},"date"]},
          value: {function: "sum", params: ["total"]},
        },
        where:[
          {function: "=", params: ["item", {value: item.id}]},
          {function: "<", params: ["quantity", {value: 0}]},
          {function: "between", params: ["date", {value: validFrom.value}, {value: validTo.value}]}
      ],
        groupBy: [{ function: "date_trunc", params: [{value:"day"},"date"]}],
        orderBy: [[{function: "date_trunc", params: [{value:"day"},"date"]}, "desc"]],
        limit: 20
      });
      timelineData.push({
        label: `Verkauf von ${item.name as string}`,
        events: transactionData.map((t: { date: string; value: number }) => ({
          date: t.date,
          value: t.value,
          label: "date"
      })),
      });
      const newsPaperSold = await datasource.find("Transaction",{
        attributes:{
          a:{function: "sum", params: ["quantity"]},
          b:{function: "sum", params: ["total"]},
        },
        where:[
          {function: "=", params: ["item", {value: item.id}]},
          {function: "<", params:["quantity", {value: 0}]},
          {function: "between", params: ["date", {value: validFrom.value}, {value: validTo.value}]}
        ]        
      }) 
      const newsPaperBought = await datasource.find("Transaction",{
        attributes:{
          a:{function: "sum", params: ["quantity"]},
          b:{function: "sum", params: ["total"]},
        },
        where:[
          {function: "=", params: ["item", {value: item.id}]},
          {function: ">", params:["quantity", {value: 0}]}
        ]        
      })
      const sold = Math.abs(newsPaperSold[0]?.a ?? 0);
      const bought = Math.abs(newsPaperBought[0]?.a ?? 0);
      const diff =   bought -sold;
      newsPaperData.push({ name: "Stück " + String(item.name), pos: sold, neg: bought, diff });
      const sold2 = Math.abs(newsPaperSold[0]?.b ?? 0);
      const bought2 = Math.abs(newsPaperBought[0]?.b ?? 0);
      const diff2 = sold2 - bought2;
      newsPaperData.push({ name: "Betrag " + String(item.name), pos: sold2, neg: bought2, diff: diff2 });
    }
    timelineSeries.value = timelineData;
    newsPaperStats.value = newsPaperData;

}, { immediate: true });
</script>