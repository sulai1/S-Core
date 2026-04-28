<template>
  <div class="row q-col-gutter-md q-pa-md">
    <div class="col-12 col-lg-7">
      <q-card flat bordered>
        <q-card-section class="row items-center q-col-gutter-sm">
          <div class="col">
            <div class="text-h6">Offene Transaktionen</div>
            <div class="text-caption text-grey-7">Nur offene Transaktionen im gewaehlten Zeitraum</div>
          </div>
          <div class="col-auto q-gutter-sm">
            <q-btn color="primary" icon="add" label="Auswahl hinzufuegen" :disable="selectedOpenIds.length === 0" @click="addSelectedTransactions" />
            <q-btn color="secondary" icon="playlist_add" label="Alle hinzufuegen" :disable="filteredOpenTransactions.length === 0" @click="addAllTransactions" />
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <TableComponent
            :columns="openColumns"
            :data="filteredOpenTransactions"
            searchable
            max-height="48vh"
          >
            <template #cell="{ row, column, value }">
              <q-checkbox
                v-if="column?.headerName === '✓'"
                dense
                :model-value="isOpenSelected(row.id)"
                @update:model-value="() => toggleOpenSelection(row.id)"
              />
              <span v-else>{{ value }}</span>
            </template>
          </TableComponent>
        </q-card-section>
      </q-card>
    </div>

    <div class="col-12 col-lg-5">
      <q-card flat bordered>
        <q-card-section class="row items-center q-col-gutter-sm">
          <div class="col">
            <div class="text-h6">Neue Rechnung</div>
            <div class="text-caption text-grey-7">Ausgewählte Positionen werden gemeinsam gespeichert</div>
          </div>
          <div class="col-auto">
            <q-btn color="negative" flat icon="remove" label="Auswahl entfernen" :disable="selectedInvoiceIds.length === 0" @click="removeSelectedTransactions" />
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section class="q-gutter-md">
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6">
              <q-input v-model="periodStart" type="date" label="Zeitraum Start" dense />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="periodEnd" type="date" label="Zeitraum Ende" dense />
            </div>
          </div>

          <q-input
            v-model="description"
            label="Beschreibung (optional)"
            hint="Leer lassen fuer automatische Beschreibung"
            dense
            @update:model-value="markDescriptionEdited"
          />

          <TableComponent
            :columns="invoiceColumns"
            :data="invoiceTransactions"
            max-height="35vh"
          >
            <template #cell="{ row, column, value }">
              <q-checkbox
                v-if="column?.headerName === '✓'"
                dense
                :model-value="isInvoiceSelected(row.id)"
                @update:model-value="() => toggleInvoiceSelection(row.id)"
              />
              <span v-else>{{ value }}</span>
            </template>
          </TableComponent>

          <div class="row items-center justify-between">
            <div class="text-subtitle1">Gesamtbetrag</div>
            <div class="text-h6">{{ formatMoney(invoiceTotal) }}</div>
          </div>

          <q-btn
            color="primary"
            icon="save"
            label="Rechnung speichern"
            :loading="saving"
            :disable="invoiceTransactions.length === 0"
            @click="saveInvoice"
          />
        </q-card-section>
      </q-card>
    </div>

    <div class="col-12">
      <q-card flat bordered>
        <q-card-section>
          <div class="text-h6">Letzte Rechnungen</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <TableComponent :columns="recentColumns" :data="recentInvoices" max-height="30vh" />
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Invoice, InvoiceItem, Transaction } from '@s-core/talktogether';
import { useQuasar } from 'quasar';
import { datasource } from 'src/boot/di';
import { useAuth } from 'src/composables/useAuth';
import TableComponent from 'src/components/TableComponent.vue';
import type { ColumnDesc, PropOrGetter } from 'src/components/table';
import { computed, onMounted, ref, watch } from 'vue';

type TransactionView = Transaction & {
  first: string;
  last: string;
  itemName: string;
};

type RecentInvoiceView = Invoice & {
  item_count: number;
};

const $q = useQuasar();
const { currentUser } = useAuth();

const openTransactions = ref<TransactionView[]>([]);
const selectedOpenIds = ref<number[]>([]);

const invoiceTransactions = ref<TransactionView[]>([]);
const selectedInvoiceIds = ref<number[]>([]);

const recentInvoices = ref<RecentInvoiceView[]>([]);
const saving = ref(false);

const periodStart = ref('');
const periodEnd = ref('');
const description = ref('');
const descriptionTouched = ref(false);

const openColumns: ColumnDesc<TransactionView, PropOrGetter<TransactionView>>[] = [
  { headerName: '✓', property: () => '' },
  { headerName: 'ID', property: 'id', sortable: true },
  { headerName: 'Datum', property: (row) => row.date ? new Date(row.date).toLocaleString() : '-', sortable: true },
  { headerName: 'Verkäufer', property: (row) => `${row.first} ${row.last}`, sortable: true },
  { headerName: 'Artikel', property: 'itemName', sortable: true },
  { headerName: 'Menge', property: 'quantity' },
  { headerName: 'Total', property: (row) => formatMoney(row.total) },
];

const invoiceColumns: ColumnDesc<TransactionView, PropOrGetter<TransactionView>>[] = [
  { headerName: '✓', property: () => '' },
  { headerName: 'ID', property: 'id', sortable: true },
  { headerName: 'Verkäufer', property: (row) => `${row.first} ${row.last}`, sortable: true },
  { headerName: 'Artikel', property: 'itemName', sortable: true },
  { headerName: 'Total', property: (row) => formatMoney(row.total) },
];

const recentColumns: ColumnDesc<RecentInvoiceView, PropOrGetter<RecentInvoiceView>>[] = [
  { headerName: 'Rechnung', property: 'id', sortable: true },
  { headerName: 'Erstellt', property: (row) => row.created_at ? new Date(row.created_at).toLocaleString() : '-', sortable: true },
  { headerName: 'Beschreibung', property: (row) => row.description ?? '-' },
  { headerName: 'Zeitraum', property: (row) => `${toLocaleDate(row.period_start)} - ${toLocaleDate(row.period_end)}` },
  { headerName: 'Positionen', property: 'item_count' },
  { headerName: 'Total', property: (row) => formatMoney(row.total) },
];

const invoiceTotal = computed(() => invoiceTransactions.value.reduce((sum, transaction) => sum + Number(transaction.total || 0), 0));
const filteredOpenTransactions = computed(() => {
  const start = toStartOfDay(periodStart.value);
  const end = toEndOfDay(periodEnd.value);
  return openTransactions.value.filter((transaction) => {
    if (!transaction.date) {
      return false;
    }
    const transactionDate = new Date(transaction.date);
    if (Number.isNaN(transactionDate.getTime())) {
      return false;
    }
    if (start && transactionDate < start) {
      return false;
    }
    if (end && transactionDate > end) {
      return false;
    }
    return true;
  });
});
const defaultDescription = computed(() => {
  const start = periodStart.value || '-';
  const end = periodEnd.value || '-';
  return `Invoice ${start}-${end}`;
});

onMounted(async () => {
  await Promise.all([loadOpenTransactions(true), loadRecentInvoices()]);
});

watch([periodStart, periodEnd], () => {
  selectedOpenIds.value = [];
  if (!descriptionTouched.value) {
    description.value = defaultDescription.value;
  }
});

function formatMoney(value: number | undefined): string {
  return `${Number(value || 0).toFixed(2)} EUR`;
}

function toLocaleDate(value: string | undefined): string {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleDateString();
}

function toStartOfDayIso(dateInput: string): string | null {
  if (!dateInput) {
    return null;
  }
  const date = new Date(`${dateInput}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function toStartOfDay(dateInput: string): Date | null {
  if (!dateInput) {
    return null;
  }
  const date = new Date(`${dateInput}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function toEndOfDay(dateInput: string): Date | null {
  if (!dateInput) {
    return null;
  }
  const date = new Date(`${dateInput}T23:59:59.999`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function markDescriptionEdited() {
  descriptionTouched.value = true;
}

function isOpenSelected(id: number | undefined): boolean {
  if (typeof id !== 'number') {
    return false;
  }
  return selectedOpenIds.value.includes(id);
}

function isInvoiceSelected(id: number | undefined): boolean {
  if (typeof id !== 'number') {
    return false;
  }
  return selectedInvoiceIds.value.includes(id);
}

function toggleOpenSelection(id: number | undefined) {
  if (typeof id !== 'number') {
    return;
  }
  if (selectedOpenIds.value.includes(id)) {
    selectedOpenIds.value = selectedOpenIds.value.filter((selectedId) => selectedId !== id);
    return;
  }
  selectedOpenIds.value = [...selectedOpenIds.value, id];
}

function toggleInvoiceSelection(id: number | undefined) {
  if (typeof id !== 'number') {
    return;
  }
  if (selectedInvoiceIds.value.includes(id)) {
    selectedInvoiceIds.value = selectedInvoiceIds.value.filter((selectedId) => selectedId !== id);
    return;
  }
  selectedInvoiceIds.value = [...selectedInvoiceIds.value, id];
}

function addSelectedTransactions() {
  if (selectedOpenIds.value.length === 0) {
    return;
  }

  const selectedSet = new Set(selectedOpenIds.value);
  const toAdd = filteredOpenTransactions.value.filter((transaction) => typeof transaction.id === 'number' && selectedSet.has(transaction.id));
  if (toAdd.length === 0) {
    return;
  }

  const toAddIds = new Set(toAdd.map((transaction) => transaction.id).filter((id): id is number => typeof id === 'number'));
  invoiceTransactions.value = [...toAdd, ...invoiceTransactions.value];
  openTransactions.value = openTransactions.value.filter((transaction) => !(typeof transaction.id === 'number' && toAddIds.has(transaction.id)));

  selectedOpenIds.value = [];
  selectedInvoiceIds.value = [];
}

function addAllTransactions() {
  if (filteredOpenTransactions.value.length === 0) {
    return;
  }

  const toAdd = [...filteredOpenTransactions.value];
  const toAddIds = new Set(toAdd.map((transaction) => transaction.id).filter((id): id is number => typeof id === 'number'));

  invoiceTransactions.value = [...toAdd, ...invoiceTransactions.value];
  openTransactions.value = openTransactions.value.filter((transaction) => !(typeof transaction.id === 'number' && toAddIds.has(transaction.id)));

  selectedOpenIds.value = [];
  selectedInvoiceIds.value = [];
}

function removeSelectedTransactions() {
  if (selectedInvoiceIds.value.length === 0) {
    return;
  }

  const selectedSet = new Set(selectedInvoiceIds.value);
  const toRemove = invoiceTransactions.value.filter((transaction) => typeof transaction.id === 'number' && selectedSet.has(transaction.id));
  invoiceTransactions.value = invoiceTransactions.value.filter((transaction) => !(typeof transaction.id === 'number' && selectedSet.has(transaction.id)));
  openTransactions.value = [...toRemove, ...openTransactions.value];
  selectedInvoiceIds.value = [];
}

function applyDefaultDateRange(force = false) {
  const candidates = openTransactions.value
    .filter((transaction) => !!transaction.date)
    .map((transaction) => new Date(transaction.date ?? ''))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  const now = new Date();
  const oldest = candidates[0] ?? now;
  if (force || !periodStart.value) {
    periodStart.value = oldest.toISOString().slice(0, 10);
  }
  if (force || !periodEnd.value) {
    periodEnd.value = now.toISOString().slice(0, 10);
  }
  if (force || !description.value || !descriptionTouched.value) {
    descriptionTouched.value = false;
    description.value = defaultDescription.value;
  }
}

async function loadOpenTransactions(useDefaultDateRange = false) {
  const result = await datasource.select({ t: 'Transaction', s: 'Salesman', i: 'Item' }, {
    attributes: {
      id: 't.id',
      date: 't.date',
      item: 't.item',
      salesman: 't.salesman',
      quantity: 't.quantity',
      price: 't.price',
      total: 't.total',
      state: 't.state',
      first: 's.first',
      last: 's.last',
      itemName: 'i.name',
    },
    where: [
      { function: '=', params: ['s.id', 't.salesman'] },
      { function: '=', params: ['i.id', 't.item'] },
    ],
    orderBy: [['t.date', 'desc']],
    limit: 500,
  });

  openTransactions.value = (result as unknown as TransactionView[])
    .filter((transaction) => Number(transaction.state ?? 0) === 0);
  if (useDefaultDateRange) {
    applyDefaultDateRange(true);
  }
}

async function loadRecentInvoices() {
  const result = await datasource.select({ inv: 'Invoice', invItem: 'InvoiceItem' }, {
    attributes: {
      id: 'inv.id',
      period_start: 'inv.period_start',
      period_end: 'inv.period_end',
      total: 'inv.total',
      created_at: 'inv.created_at',
      description: 'inv.description',
      state: 'inv.state',
      item_count: { function: 'count', params: ['invItem.transaction_id'] },
    },
    where: [
      { function: '=', params: ['inv.id', 'invItem.invoice_id'] },
    ],
    groupBy: ['inv.id', 'inv.period_start', 'inv.period_end', 'inv.total', 'inv.created_at', 'inv.description', 'inv.state'],
    orderBy: [['inv.created_at', 'desc']],
    limit: 20,
  });

  recentInvoices.value = result as unknown as RecentInvoiceView[];
}

async function saveInvoice() {
  if (invoiceTransactions.value.length === 0) {
    return;
  }

  const transactionIds = invoiceTransactions.value
    .map((transaction) => transaction.id)
    .filter((id): id is number => typeof id === 'number');

  if (transactionIds.length !== invoiceTransactions.value.length) {
    $q.notify({ message: 'Eine Transaktion hat keine ID.', color: 'negative' });
    return;
  }

  saving.value = true;
  try {
    const invoiceToInsert = {
      period_start: toStartOfDayIso(periodStart.value),
      period_end: toStartOfDayIso(periodEnd.value),
      description: description.value.trim() || defaultDescription.value,
      total: Number(invoiceTotal.value.toFixed(2)),
      state: 0,
      invoice_type: 1,
      user_id: currentUser.value?.id ?? null,
    } as Invoice;

    const invoiceInsertResult = await datasource.insert('Invoice', [invoiceToInsert]);
    const invoiceId = (invoiceInsertResult?.[0] as Invoice | undefined)?.id;

    if (!invoiceId) {
      throw new Error('Rechnung konnte nicht angelegt werden.');
    }

    const itemsToInsert = transactionIds.map((transactionId) => ({
      invoice_id: invoiceId,
      transaction_id: transactionId,
    })) as InvoiceItem[];

    await datasource.insert('InvoiceItem', itemsToInsert);
    await datasource.update('Transaction', { state: 1 } as Transaction, [{ function: 'in', params: ['id', { value: transactionIds }] }]);

    invoiceTransactions.value = [];
    selectedInvoiceIds.value = [];
    selectedOpenIds.value = [];
    descriptionTouched.value = false;

    await Promise.all([loadOpenTransactions(true), loadRecentInvoices()]);
    $q.notify({ message: `Rechnung #${invoiceId} gespeichert.`, color: 'positive' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    $q.notify({ message, color: 'negative' });
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.q-card {
  height: 100%;
}
</style>
