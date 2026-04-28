<template>
  <q-page class="dashboard-page q-pa-md">
    <div class="row q-col-gutter-md q-mb-md items-start">
      <div class="col-12 col-sm-6">
        <q-input
          v-model="validFrom"
          label="Gültig von"
          dense
          outlined
          class="full-width"
          type="date"
          :rules="[ val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val) || 'Ungültiges Datumsformat (YYYY-MM-DD)']"
        />
      </div>
      <div class="col-12 col-sm-6">
        <q-input
          v-model="validTo"
          label="Gültig bis"
          dense
          outlined
          class="full-width"
          type="date"
          :rules="[ val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val) || 'Ungültiges Datumsformat (YYYY-MM-DD)']"
        />
      </div>
    </div>

    <div class="row q-col-gutter-md items-stretch">
      <div class="col-12 col-xl-4 col-lg-5">

        <q-card class="my-card dashboard-card">
          <q-card-section class="fit dashboard-card-section">
             <div clickable v-ripple class="text-h6 q-mb-sm dashboard-section-title" @click="router.push({ name: 'sales' })">Verkauf</div>
            <TimelineChart
              :data="timelineSeries"
              title="Verkauf"
              yAxisLabel="Betrag (€)"
              backgroundColor="rgba(75, 192, 192, 0.1)"
              borderColor="rgb(75, 192, 192)"
              :fillArea="true"
              class="dashboard-widget"
            />
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-xl-3 col-lg-4">
        <q-card class="my-card dashboard-card">
          <q-card-section class="fit dashboard-card-section">
            <div clickable v-ripple class="text-h6 q-mb-sm dashboard-section-title" @click="router.push({ name: 'item' })">Zeitungen</div>
            <div class="dashboard-table-wrapper">
              <TableComponent
                :columns="[{ headerName: 'Name', property: 'name' }, 
                { headerName: 'Verkauf', property: 'pos', cellClass: () => 'text-positive' }, 
                { headerName: 'Einkauf', property: 'neg', cellClass: () => 'text-negative'}, 
                { headerName: 'Gewinn', property: 'diff' }]"
                :data="newsPaperStats"
                max-height="320px"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-xl-5 col-lg-12">
        <q-card class="my-card dashboard-card">
          <q-card-section class="fit dashboard-card-section">
            <div clickable v-ripple class="text-h6 q-mb-sm dashboard-section-title" @click="router.push({ name: 'salesmen' })">Verkäufer</div>
              <ScrollableBarChart
                :data="barChartData"
                title="Gewinn pro Eintrag"
                axisLabel="Gewinn"
                :visibleBars="6"
                class="dashboard-widget"
              />
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-xl-6 col-lg-8">
        <q-card class="my-card dashboard-card">
          <q-card-section class="fit dashboard-card-section">
            <div clickable v-ripple class="text-h6 q-mb-sm dashboard-section-title" @click="router.push({ name: 'invoices' })">Rechnungsbeträge</div>
            <TimelineChart
              :data="invoiceAmountSeries"
              title="Rechnungsbeträge im Zeitraum"
              yAxisLabel="Betrag (EUR)"
              backgroundColor="rgba(25, 118, 210, 0.12)"
              borderColor="rgb(25, 118, 210)"
              :fillArea="true"
              class="dashboard-widget"
            />
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-xl-3 col-lg-4">
        <q-card class="my-card dashboard-card dashboard-link-card" clickable v-ripple @click="router.push({ name: 'salesmen' })">
          <q-card-section class="fit dashboard-card-section">
            <div class="text-h6 q-mb-sm dashboard-section-title">Verkäufer Status</div>
            <div class="salesman-stats-grid">
              <div class="salesman-stat-item">
                <div class="salesman-stat-label">Gesamt</div>
                <div class="salesman-stat-value">{{ salesmanStats.total }}</div>
              </div>
              <div class="salesman-stat-item">
                <div class="salesman-stat-label">Gesperrt</div>
                <div class="salesman-stat-value">{{ salesmanStats.locked }}</div>
              </div>
              <div class="salesman-stat-item">
                <div class="salesman-stat-label">Aktiv</div>
                <div class="salesman-stat-value">{{ salesmanStats.active }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-xl-3 col-lg-4">
        <q-card class="my-card dashboard-card dashboard-link-card" clickable v-ripple @click="router.push({ name: 'print' })">
          <q-card-section class="fit dashboard-card-section">
            <div class="text-h6 q-mb-sm dashboard-section-title">Letzte Ausweise</div>
            <div class="recent-id-list">
              <div v-if="recentIds.length === 0" class="recent-id-empty">
                Keine Ausweise gefunden
              </div>
              <div v-for="entry in recentIds" :key="entry.id" class="recent-id-item">
                <div class="recent-id-top-row">
                  <span class="recent-id-number">#{{ entry.idNr }}</span>
                  <span class="recent-id-date">{{ entry.createdAt }}</span>
                </div>
                <div class="recent-id-salesman">{{ entry.salesman }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-xl-3 col-lg-4">
        <q-card class="my-card dashboard-card dashboard-link-card" clickable v-ripple @click="router.push({ name: 'transaction' })">
          <q-card-section class="fit dashboard-card-section">
            <div class="text-h6 q-mb-sm dashboard-section-title">Letzte Transaktionen</div>
            <div class="recent-transaction-list">
              <div v-if="recentTransactions.length === 0" class="recent-id-empty">
                Keine Transaktionen gefunden
              </div>
              <div v-for="entry in recentTransactions" :key="entry.id" class="recent-transaction-item">
                <div class="recent-transaction-top-row">
                  <span class="recent-transaction-salesman">{{ entry.salesman }}</span>
                  <span class="recent-transaction-date">{{ entry.date }}</span>
                </div>
                <div class="recent-transaction-meta">{{ entry.item }}</div>
                <div class="recent-transaction-total">{{ entry.total }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-xl-3 col-lg-4">
        <q-card class="my-card dashboard-card dashboard-link-card" clickable v-ripple @click="router.push({ name: 'invoice' })">
          <q-card-section class="fit dashboard-card-section">
            <div class="text-h6 q-mb-sm dashboard-section-title">Letzte Rechnungen</div>
            <div class="recent-invoice-list">
              <div v-if="recentInvoices.length === 0" class="recent-id-empty">
                Keine Rechnungen gefunden
              </div>
              <div v-for="entry in recentInvoices" :key="entry.id" class="recent-invoice-item">
                <div class="recent-invoice-top-row">
                  <span class="recent-invoice-id">#{{ entry.id }}</span>
                  <span class="recent-invoice-date">{{ entry.createdAt }}</span>
                </div>
                <div class="recent-invoice-desc">{{ entry.description }}</div>
                <div class="recent-invoice-total">{{ entry.total }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { datasource } from 'src/boot/di';
import type { BarChartItem } from 'src/components/chart/ScrollableBarChart.vue';
import ScrollableBarChart from 'src/components/chart/ScrollableBarChart.vue';
import type { TimelineSeries } from 'src/components/chart/TimelineChart.vue';
import TimelineChart from 'src/components/chart/TimelineChart.vue';
import TableComponent from 'src/components/TableComponent.vue';
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter(); 

const timelineSeries = ref<TimelineSeries[]>([]);
const newsPaperStats = ref<{ name:string, pos:number, neg:number, diff:number}[]>([]);
const barChartData = ref<BarChartItem[]>([]);
const salesmanStats = ref({
  total: 0,
  locked: 0,
  active: 0,
});
const recentIds = ref<{ id: number; idNr: number; salesman: string; createdAt: string }[]>([]);
const recentTransactions = ref<{ id: number; salesman: string; item: string; total: string; date: string }[]>([]);
const recentInvoices = ref<{ id: number; createdAt: string; description: string; total: string }[]>([]);
const invoiceAmountSeries = ref<TimelineSeries[]>([]);

const validFrom = ref<string>(new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().substring(0, 10));
const validTo = ref<string>(new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().substring(0, 10));

function toRangeStartIso(date: string): string {
  return `${date}T00:00:00.000Z`;
}

function toRangeEndIso(date: string): string {
  return `${date}T23:59:59.999Z`;
}

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
      const transactionData = await getTransactionData(item.id, item.name, validFrom.value, validTo.value);
      timelineData.push(transactionData);
      const newsPaperStatsData = await getNewsPaperStats(item.id, item.name, validFrom.value, validTo.value);
      newsPaperData.push(...newsPaperStatsData);

    }
    timelineSeries.value = timelineData;
    newsPaperStats.value = newsPaperData;
    barChartData.value = await getSalesmanData(validFrom.value, validTo.value);
    salesmanStats.value = await getSalesmanStats();
    recentIds.value = await getRecentIds();
    recentTransactions.value = await getRecentTransactions();
    recentInvoices.value = await getRecentInvoices();
    invoiceAmountSeries.value = await getInvoiceAmountSeries(validFrom.value, validTo.value);

}, { immediate: true });
  async function getTransactionData(itemId: number, itemName: string, from: string, to: string): Promise<TimelineSeries> {
    const fromIso = toRangeStartIso(from);
    const toIso = toRangeEndIso(to);
    const data = await datasource.find("Transaction", {
        attributes: {
          date: {function: "date_trunc", params: [{value:"day"},"date"]},
          value: {function: "sum", params: ["total"]},
        },
        where:[
          {function: "=", params: ["item", {value: itemId}]},
          {function: "<", params: ["quantity", {value: 0}]},
          {function: "between", params: ["date", {value: fromIso}, {value: toIso}]}
      ],
        groupBy: [{ function: "date_trunc", params: [{value:"day"},"date"]}],
        orderBy: [[{function: "date_trunc", params: [{value:"day"},"date"]}, "asc"]],
        limit: 200
      });
      return{
        label: `Verkauf von ${itemName}`,
        events: data.map((t: { date: string; value: number }) => ({
          date: t.date,
          value: t.value,
          label: "date"
      })),
      };
  }
  async function getNewsPaperStats(itemId: number, itemName: string, from: string, to: string): Promise<{ name:string, pos:number, neg:number, diff:number}[]> {
    const fromIso = toRangeStartIso(from);
    const toIso = toRangeEndIso(to);
    const newsPaperSold = await datasource.find("Transaction",{
          attributes:{
            a:{function: "sum", params: ["quantity"]},
            b:{function: "sum", params: ["total"]},
          },
          where:[
            {function: "=", params: ["item", {value: itemId}]},
            {function: "<", params:["quantity", {value: 0}]},
            {function: "between", params: ["date", {value: fromIso}, {value: toIso}]}
          ]        
        }) 
        const newsPaperBought = await datasource.find("Transaction",{
          attributes:{
            a:{function: "sum", params: ["quantity"]},
            b:{function: "sum", params: ["total"]},
          },
          where:[
            {function: "=", params: ["item", {value: itemId}]},
            {function: ">", params:["quantity", {value: 0}]}
          ]        
        })
        const sold = Math.abs(newsPaperSold[0]?.a ?? 0);
        const bought = Math.abs(newsPaperBought[0]?.a ?? 0);
        const diff =   bought -sold;
        const sold2 = Math.abs(newsPaperSold[0]?.b ?? 0);
        const bought2 = Math.abs(newsPaperBought[0]?.b ?? 0);
        const diff2 = sold2 - bought2;
        return [
          { name: "Stück " + itemName, pos: sold, neg: bought, diff },
          { name: "Betrag " + itemName, pos: sold2, neg: bought2, diff: diff2 }
        ];
  }
  async function getSalesmanData( from: string, to: string): Promise<BarChartItem[]> {
    const fromIso = toRangeStartIso(from);
    const toIso = toRangeEndIso(to);
    return await datasource.select({ s: "Salesman", t: "Transaction" },{
          attributes:{
            label:{function: "concat", params: ["s.first", "s.last"]},
            value:{function: "sum", params: ["t.total"]},
          },
          where:[
            {function: "between", params: ["t.date", {value: fromIso}, {value: toIso}]},
            {function: "<", params: ["t.quantity", {value: 0}]},
            {function: "=", params: ["t.salesman", "s.id"]},
          ],
          groupBy:[{function: "concat", params: ["s.first", "s.last"]}],
          orderBy:[[{function: "sum", params: ["t.total"]}, "desc"]],
        });
  }

  async function getSalesmanStats(): Promise<{ total: number; locked: number; active: number }> {
    const salesmen = await datasource.find('Salesman', {
      attributes: {
        locked: 'locked',
      },
    });

    const total = salesmen.length;
    const locked = salesmen.filter((salesman: { locked?: boolean | null }) => Boolean(salesman.locked)).length;

    return {
      total,
      locked,
      active: Math.max(total - locked, 0),
    };
  }

  async function getRecentIds(): Promise<{ id: number; idNr: number; salesman: string; createdAt: string }[]> {
    const result = await datasource.select({ Identification: 'Identification', Salesman: 'Salesman' }, {
      attributes: {
        id: 'Identification.id',
        idNr: 'Identification.id_nr',
        first: 'Salesman.first',
        last: 'Salesman.last',
        createdAt: 'Identification.createdAt',
      },
      where: [
        { function: '=', params: ['Identification.salesman', 'Salesman.id'] },
      ],
      orderBy: [['Identification.createdAt', 'desc'], ['Identification.id_nr', 'desc']],
      limit: 6,
    });

    return result.map((entry: { id: number; idNr: number; first?: string; last?: string; createdAt?: string }) => ({
      id: entry.id,
      idNr: entry.idNr,
      salesman: `${entry.last ?? ''} ${entry.first ?? ''}`.trim() || 'Unbekannt',
      createdAt: entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : '-',
    }));
  }

  async function getRecentTransactions(): Promise<{ id: number; salesman: string; item: string; total: string; date: string }[]> {
    const result = await datasource.select({ t: 'Transaction', s: 'Salesman', i: 'Item' }, {
      attributes: {
        id: 't.id',
        first: 's.first',
        last: 's.last',
        item: 'i.name',
        total: 't.total',
        date: 't.date',
      },
      where: [
        { function: '=', params: ['s.id', 't.salesman'] },
        { function: '=', params: ['i.id', 't.item'] },
      ],
      orderBy: [['t.date', 'desc'], ['t.id', 'desc']],
      limit: 6,
    });

    return result.map((entry: { id: number; first?: string; last?: string; item?: string; total?: number; date?: string }) => ({
      id: entry.id,
      salesman: `${entry.last ?? ''} ${entry.first ?? ''}`.trim() || 'Unbekannt',
      item: entry.item ?? 'Unbekannt',
      total: `${Number(entry.total ?? 0).toFixed(2)} EUR`,
      date: entry.date ? new Date(entry.date).toLocaleString() : '-',
    }));
  }

  async function getRecentInvoices(): Promise<{ id: number; createdAt: string; description: string; total: string }[]> {
    const result = await datasource.find('Invoice', {
      where: [
        { function: '>=', params: ['id', { value: 1 }] },
      ],
      orderBy: [['created_at', 'desc'], ['id', 'desc']],
      limit: 6,
    });

    return (result as Array<{ id: number; created_at?: string; description?: string; total?: number }>).map((entry) => ({
      id: entry.id,
      createdAt: entry.created_at ? new Date(entry.created_at).toLocaleString() : '-',
      description: entry.description?.trim() || 'Keine Beschreibung',
      total: `${Number(entry.total ?? 0).toFixed(2)} EUR`,
    }));
  }

  async function getInvoiceAmountSeries(from: string, to: string): Promise<TimelineSeries[]> {
    const invoices = await datasource.find('Invoice', {
      attributes: {
        id: 'id',
        createdAt: 'created_at',
        total: 'total',
      },
      where: [
        { function: 'between', params: ['created_at', { value: `${from}T00:00:00.000Z` }, { value: `${to}T23:59:59.999Z` }] },
      ],
      orderBy: [['created_at', 'asc']],
      limit: 200,
    });

    return [
      {
        label: 'Rechnungsbetrag',
        events: (invoices as Array<{ id: number; createdAt?: string; total?: number }>).map((invoice) => ({
          date: invoice.createdAt ?? new Date().toISOString(),
          value: Number(invoice.total ?? 0),
          label: `Rechnung #${invoice.id}`,
        })),
      },
    ];
  }

</script>

<style scoped>
.dashboard-page {
  width: 100%;
  --dashboard-font-family: var(--q-font-family, 'Roboto', 'Helvetica Neue', Arial, sans-serif);
  --dashboard-text-color: #1f2937;
  --dashboard-muted-text-color: #5f6b7a;
  --dashboard-grid-color: rgba(31, 41, 55, 0.14);
  --dashboard-surface-color: #ffffff;
  --dashboard-border-color: rgba(31, 41, 55, 0.12);
  color: var(--dashboard-text-color);
  font-family: var(--dashboard-font-family);
}

.dashboard-card {
  height: 100%;
}

.dashboard-card-section {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.dashboard-widget {
  flex: 1;
  min-height: 0;
}

.dashboard-card {
  background: var(--dashboard-surface-color);
  border: 1px solid var(--dashboard-border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.dashboard-link-card {
  cursor: pointer;
}

.dashboard-link-card:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
}

.dashboard-section-title {
  color: var(--dashboard-text-color);
  font-family: var(--dashboard-font-family);
  font-weight: 600;
  cursor: pointer;
  transition: color 0.18s ease;
}

.dashboard-section-title:hover {
  color: var(--q-primary);
}

.dashboard-table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.dashboard-widget :deep(.chart-wrapper) {
  min-height: 280px;
}

.dashboard-widget :deep(.chart-canvas-wrapper) {
  min-height: 320px;
}

.dashboard-table-wrapper :deep(table),
.dashboard-table-wrapper :deep(th),
.dashboard-table-wrapper :deep(td) {
  font-family: var(--dashboard-font-family);
  color: var(--dashboard-text-color);
}

.dashboard-table-wrapper :deep(thead th) {
  font-weight: 600;
  color: var(--dashboard-text-color);
  border-bottom: 1px solid var(--dashboard-border-color);
}

.dashboard-table-wrapper :deep(tbody td) {
  color: var(--dashboard-muted-text-color);
}

.salesman-stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.salesman-stat-item {
  border: 1px solid var(--dashboard-border-color);
  border-radius: 8px;
  background: rgba(31, 41, 55, 0.02);
  padding: 10px 12px;
}

.salesman-stat-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--dashboard-muted-text-color);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.salesman-stat-value {
  font-size: 22px;
  line-height: 1.2;
  font-weight: 700;
  color: var(--dashboard-text-color);
}

.recent-id-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-id-empty {
  color: var(--dashboard-muted-text-color);
  font-size: 13px;
}

.recent-id-item {
  border: 1px solid var(--dashboard-border-color);
  border-radius: 8px;
  background: rgba(31, 41, 55, 0.02);
  padding: 8px 10px;
}

.recent-id-top-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}

.recent-id-number {
  font-weight: 700;
  color: var(--dashboard-text-color);
}

.recent-id-date {
  font-size: 12px;
  color: var(--dashboard-muted-text-color);
}

.recent-id-salesman {
  margin-top: 2px;
  font-size: 13px;
  color: var(--dashboard-muted-text-color);
}

.recent-transaction-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-transaction-item {
  border: 1px solid var(--dashboard-border-color);
  border-radius: 8px;
  background: rgba(31, 41, 55, 0.02);
  padding: 8px 10px;
}

.recent-transaction-top-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}

.recent-transaction-salesman {
  font-weight: 600;
  color: var(--dashboard-text-color);
}

.recent-transaction-date {
  font-size: 12px;
  color: var(--dashboard-muted-text-color);
}

.recent-transaction-meta {
  margin-top: 2px;
  font-size: 13px;
  color: var(--dashboard-muted-text-color);
}

.recent-transaction-total {
  margin-top: 2px;
  font-size: 13px;
  font-weight: 700;
  color: var(--dashboard-text-color);
}

.recent-invoice-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-invoice-item {
  border: 1px solid var(--dashboard-border-color);
  border-radius: 8px;
  background: rgba(31, 41, 55, 0.02);
  padding: 8px 10px;
}

.recent-invoice-top-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}

.recent-invoice-id {
  font-weight: 700;
  color: var(--dashboard-text-color);
}

.recent-invoice-date {
  font-size: 12px;
  color: var(--dashboard-muted-text-color);
}

.recent-invoice-desc {
  margin-top: 2px;
  font-size: 13px;
  color: var(--dashboard-muted-text-color);
}

.recent-invoice-total {
  margin-top: 2px;
  font-size: 13px;
  font-weight: 700;
  color: var(--dashboard-text-color);
}

@media (max-width: 1023px) {
  .dashboard-page {
    padding: 12px;
  }
}
</style>