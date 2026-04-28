<template>
  <q-page class="q-pa-md">
    <q-card flat bordered>
      <q-card-section class="row q-col-gutter-sm items-end">
        <div class="col-12 col-sm-6 col-md-2">
          <q-input v-model="createdFrom" type="date" dense label="Erstellt von" />
        </div>
        <div class="col-12 col-sm-6 col-md-2">
          <q-input v-model="createdTo" type="date" dense label="Erstellt bis" />
        </div>
        <div class="col-12 col-sm-6 col-md-2">
          <q-select
            v-model="stateFilter"
            :options="stateOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            dense
            label="Status"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-2">
          <q-input v-model.number="minTotal" type="number" dense label="Min Total" />
        </div>
        <div class="col-12 col-sm-6 col-md-2">
          <q-input v-model.number="maxTotal" type="number" dense label="Max Total" />
        </div>
        <div class="col-12 col-sm-6 col-md-2">
          <q-btn color="secondary" flat icon="restart_alt" label="Reset" @click="resetFilters" />
        </div>
      </q-card-section>

      <q-separator v-if="selectedInvoiceIds.length > 0" />

      <q-card-section v-if="selectedInvoiceIds.length > 0" class="q-gutter-sm">
        <div class="text-subtitle1">{{ selectedInvoiceIds.length }} Rechnung(en) ausgewählt</div>
        <q-btn
          color="warning"
          icon="merge"
          label="Rechnungen zusammenfassen"
          :disable="selectedInvoiceIds.length < 2"
          @click="initiateGrouping"
        />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <TableComponent
          v-model:selected="selectedInvoice"
          :columns="columns"
          :data="filteredInvoices"
          searchable
          max-height="60vh"
        >
          <template #cell="{ row, column, value }">
            <q-checkbox
              v-if="column?.headerName === '✓'"
              dense
              :model-value="isInvoiceSelected(row.id)"
              @update:model-value="() => toggleInvoiceSelection(row.id)"
            />
            <q-btn
              v-else-if="column?.headerName === 'Aktion'"
              size="sm"
              color="primary"
              flat
              icon="visibility"
              label="Details"
              @click.stop="openDetails(row.id)"
            />
            <span v-else>{{ value }}</span>
          </template>
        </TableComponent>
      </q-card-section>
    </q-card>

    <q-dialog v-model="groupingDialogOpen">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Rechnungen zusammenfassen</div>
          <div class="text-caption text-grey-7">
            {{ selectedInvoiceIds.length }} Rechnung(en) in einer neuen Rechnung zusammenfassen
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section class="q-gutter-md">
          <q-input
            v-model="groupingDescription"
            outlined
            dense
            label="Beschreibung (optional)"
            placeholder="Leer lassen für automatische Beschreibung"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Abbrechen" color="primary" @click="groupingDialogOpen = false" />
          <q-btn
            unelevated
            label="Zusammenfassen"
            color="warning"
            @click="confirmGrouping"
            :disable="grouping"
            :loading="grouping"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import type { Invoice } from '@s-core/talktogether';
import { datasource } from 'src/boot/di';
import TableComponent from 'src/components/TableComponent.vue';
import type { ColumnDesc, PropOrGetter } from 'src/components/table';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuth } from 'src/composables/useAuth';

type InvoiceListRow = Invoice & {
  item_count: number;
};

type StateFilter = 'all' | 0 | 1 | 9;

const router = useRouter();
const $q = useQuasar();
const { currentUser } = useAuth();

const invoices = ref<InvoiceListRow[]>([]);
const selectedInvoice = ref<InvoiceListRow | null>(null);
const selectedInvoiceIds = ref<number[]>([]);

const createdFrom = ref('');
const createdTo = ref('');
const stateFilter = ref<StateFilter>('all');
const minTotal = ref<number | null>(null);
const maxTotal = ref<number | null>(null);

const groupingDialogOpen = ref(false);
const groupingDescription = ref('');
const grouping = ref(false);

const stateOptions: { label: string; value: StateFilter }[] = [
  { label: 'Alle', value: 'all' },
  { label: 'Offen', value: 0 },
  { label: 'Abgeschlossen', value: 1 },
  { label: 'Zusammengefasst', value: 9 },
];

const columns: ColumnDesc<InvoiceListRow, PropOrGetter<InvoiceListRow>>[] = [
  { headerName: '✓', property: () => '' },
  { headerName: 'ID', property: 'id', sortable: true },
  { headerName: 'Erstellt', property: (row) => toLocaleDateTime(row.created_at), sortable: true },
  { headerName: 'Beschreibung', property: (row) => row.description ?? '-' },
  { headerName: 'Zeitraum', property: (row) => `${toLocaleDate(row.period_start)} - ${toLocaleDate(row.period_end)}` },
  { headerName: 'Positionen', property: 'item_count', sortable: true },
  { headerName: 'Total', property: (row) => formatMoney(row.total), sortable: true, sortFunction: (a, b) => Number(a.total ?? 0) - Number(b.total ?? 0) },
  { headerName: 'Status', property: (row) => getStateLabel(row.state), sortable: true },
  { headerName: 'Aktion', property: () => '' },
];

const filteredInvoices = computed(() => {
  const from = createdFrom.value ? new Date(`${createdFrom.value}T00:00:00`) : null;
  const to = createdTo.value ? new Date(`${createdTo.value}T23:59:59.999`) : null;

  return invoices.value.filter((invoice) => {
    const created = invoice.created_at ? new Date(invoice.created_at) : null;
    if (from && created && created < from) {
      return false;
    }
    if (to && created && created > to) {
      return false;
    }
    if (stateFilter.value !== 'all' && Number(invoice.state ?? 0) !== stateFilter.value) {
      return false;
    }
    if (typeof minTotal.value === 'number' && Number(invoice.total ?? 0) < minTotal.value) {
      return false;
    }
    if (typeof maxTotal.value === 'number' && Number(invoice.total ?? 0) > maxTotal.value) {
      return false;
    }
    return true;
  });
});

onMounted(async () => {
  await loadInvoices();
});

async function loadInvoices() {
  const invoiceRows = await datasource.find('Invoice', {
    where: [
      { function: '>=', params: ['id', { value: 1 }] },
    ],
    limit: 2000,
  });

  const sortedInvoices = (invoiceRows as unknown as Invoice[])
    .slice()
    .sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });

  if (sortedInvoices.length === 0) {
    invoices.value = [];
    return;
  }

  const itemCounts = await datasource.select({ invItem: 'InvoiceItem' }, {
    attributes: {
      invoice_id: 'invItem.invoice_id',
      item_count: { function: 'count', params: ['invItem.transaction_id'] },
    },
    where: [
      { function: '>=', params: ['invItem.invoice_id', { value: 0 }] },
    ],
    groupBy: ['invItem.invoice_id'],
    limit: 10000,
  });

  const countMap = new Map<number, number>();
  for (const countRow of itemCounts as unknown as Array<{ invoice_id: number; item_count: number }>) {
    countMap.set(Number(countRow.invoice_id), Number(countRow.item_count ?? 0));
  }

  invoices.value = sortedInvoices.map((invoice) => ({
    ...invoice,
    item_count: countMap.get(Number(invoice.id)) ?? 0,
  }));
}

function resetFilters() {
  createdFrom.value = '';
  createdTo.value = '';
  stateFilter.value = 'all';
  minTotal.value = null;
  maxTotal.value = null;
  selectedInvoiceIds.value = [];
}

function isInvoiceSelected(id: number | undefined): boolean {
  if (typeof id !== 'number') {
    return false;
  }
  return selectedInvoiceIds.value.includes(id);
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

function getStateLabel(state: number | undefined): string {
  const stateNum = Number(state ?? 0);
  if (stateNum === 1) return 'Abgeschlossen';
  if (stateNum === 9) return 'Zusammengefasst';
  return 'Offen';
}

function initiateGrouping() {
  if (selectedInvoiceIds.value.length < 2) {
    $q.notify({ message: 'Bitte mindestens 2 Rechnungen auswählen', color: 'warning' });
    return;
  }
  groupingDescription.value = '';
  groupingDialogOpen.value = true;
}

async function confirmGrouping() {
  if (selectedInvoiceIds.value.length < 2) {
    return;
  }

  grouping.value = true;
  try {
    // Get all selected invoices
    const selectedInvoices = invoices.value.filter((inv) => selectedInvoiceIds.value.includes(inv.id));
    if (selectedInvoices.length < 2) {
      throw new Error('Mindestens 2 Rechnungen erforderlich');
    }

    // Find earliest start and latest end date
    let earliestStart: string | null = null;
    let latestEnd: string | null = null;
    let totalAmount = 0;

    for (const invoice of selectedInvoices) {
      const start = invoice.period_start ? new Date(invoice.period_start) : null;
      const end = invoice.period_end ? new Date(invoice.period_end) : null;

      if (start) {
        if (!earliestStart || start < new Date(earliestStart)) {
          earliestStart = invoice.period_start ?? null;
        }
      }
      if (end) {
        if (!latestEnd || end > new Date(latestEnd)) {
          latestEnd = invoice.period_end ?? null;
        }
      }
      totalAmount += Number(invoice.total ?? 0);
    }

    // Create new invoice with auto-calculated dates and totals
    const defaultDesc = `Invoice ${earliestStart ? earliestStart.substring(0, 10) : ''}-${latestEnd ? latestEnd.substring(0, 10) : ''}`;
    const newInvoice = {
      period_start: earliestStart,
      period_end: latestEnd,
      description: groupingDescription.value.trim() || defaultDesc,
      total: Number(totalAmount.toFixed(2)),
      state: 0,
      invoice_type: 2,
      user_id: currentUser.value?.id ?? null,
    } as Invoice;

    const invoiceInsertResult = await datasource.insert('Invoice', [newInvoice]);
    const newInvoiceId = (invoiceInsertResult?.[0] as Invoice | undefined)?.id;

    if (!newInvoiceId) {
      throw new Error('Neue Rechnung konnte nicht erstellt werden');
    }

    // Link selected invoices to the new grouped invoice
    for (const sourceId of selectedInvoiceIds.value) {
      await datasource.insert('InvoiceGroupMember', [
        {
          group_invoice_id: newInvoiceId,
          member_invoice_id: sourceId,
        },
      ]);
    }

    // Mark source invoices as grouped
    for (const sourceId of selectedInvoiceIds.value) {
      await datasource.update('Invoice', { state: 9 }, [
        { function: '=', params: ['id', { value: sourceId }] },
      ]);
    }

    $q.notify({ message: `Neue Rechnung #${newInvoiceId} mit ${selectedInvoiceIds.value.length} Rechnung(en) erstellt`, color: 'positive' });
    groupingDialogOpen.value = false;
    selectedInvoiceIds.value = [];
    await loadInvoices();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    $q.notify({ message: `Fehler: ${message}`, color: 'negative' });
  } finally {
    grouping.value = false;
  }
}

function openDetails(id: number | undefined) {
  if (typeof id !== 'number') {
    return;
  }
  router.push({ name: 'invoice-detail', params: { id } }).catch((error: unknown) => console.error(error));
}

function formatMoney(value: number | undefined): string {
  return `${Number(value ?? 0).toFixed(2)} EUR`;
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

function toLocaleDateTime(value: string | undefined): string {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleString();
}
</script>
