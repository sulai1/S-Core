<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <q-btn flat icon="arrow_back" label="Zurueck zu Rechnungen" @click="goBack" />
      </div>

      <div class="col-12" v-if="loading">
        <q-linear-progress indeterminate color="primary" />
      </div>

      <div class="col-12" v-else-if="!invoice">
        <q-banner class="bg-red-1 text-negative">
          Rechnung nicht gefunden.
        </q-banner>
      </div>

      <template v-else>
        <div class="col-12 col-lg-4">
          <q-card flat bordered>
            <q-card-section>
              <div class="text-h6">Rechnung #{{ invoice.id }}</div>
            </q-card-section>
            <q-separator />
            <q-card-section class="q-gutter-sm">
              <div><strong>Beschreibung:</strong> {{ invoice.description || '-' }}</div>
              <div><strong>Status:</strong> {{ getInvoiceStateLabel(invoice) }}</div>
              <div><strong>Typ:</strong> {{ isGroupedInvoice ? 'Gruppenrechnung' : 'Einzelrechnung' }}</div>
              <div><strong>Erstellt:</strong> {{ toLocaleDateTime(invoice.created_at) }}</div>
              <div><strong>Zeitraum:</strong> {{ toLocaleDate(invoice.period_start) }} - {{ toLocaleDate(invoice.period_end) }}</div>
              <div><strong>Positionen:</strong> {{ totalItemCount }}</div>
              <div><strong>Benutzer:</strong> {{ invoice.user_id || '-' }}</div>
              <div v-if="isGroupedInvoice"><strong>Mitgliedsrechnungen:</strong> {{ groupedSections.length }}</div>
              <div><strong>Total:</strong> {{ formatMoney(invoice.total) }}</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-lg-8">
          <q-card v-if="!isGroupedInvoice" flat bordered>
            <q-card-section>
              <div class="text-h6">Positionen</div>
            </q-card-section>
            <q-separator />
            <q-card-section>
              <TableComponent
                :columns="itemColumns"
                :data="items"
                searchable
                max-height="50vh"
              />
            </q-card-section>
            <q-separator />
            <q-card-section class="q-gutter-md">
              <div class="row q-col-gutter-lg">
                <div class="col-12 col-md-6">
                  <div class="text-h6">Menge</div>
                  <div class="row q-col-gutter-md">
                    <div class="col-6">
                      <div class="text-subtitle2 text-positive">Positiv</div>
                      <div class="text-h5">{{ positiveQuantity }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-subtitle2 text-negative">Negativ</div>
                      <div class="text-h5">{{ negativeQuantity }}</div>
                    </div>
                  </div>
                </div>
                <div class="col-12 col-md-6">
                  <div class="text-h6">Betrag</div>
                  <div class="row q-col-gutter-md">
                    <div class="col-6">
                      <div class="text-subtitle2 text-positive">Positiv</div>
                      <div class="text-h5">{{ formatMoney(positiveTotal) }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-subtitle2 text-negative">Negativ</div>
                      <div class="text-h5">{{ formatMoney(negativeTotal) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <div v-else class="q-gutter-md">
            <q-card
              v-for="section in groupedSections"
              :key="section.invoice.id"
              flat
              bordered
            >
              <q-card-section class="row q-col-gutter-md items-center">
                <div class="col-12 col-md-6">
                  <div class="text-subtitle1">Rechnung #{{ section.invoice.id }}</div>
                  <div class="text-caption text-grey-7">
                    {{ section.invoice.description || '-' }}
                  </div>
                </div>
                <div class="col-12 col-md-6 text-md-right">
                  <div>Zeitraum: {{ toLocaleDate(section.invoice.period_start) }} - {{ toLocaleDate(section.invoice.period_end) }}</div>
                  <div>Benutzer: {{ section.invoice.user_id || '-' }}</div>
                  <div>Positionen: {{ section.items.length }}</div>
                  <div>Total: {{ formatMoney(section.invoice.total) }}</div>
                </div>
              </q-card-section>
              <q-separator />
              <q-card-section>
                <TableComponent
                  :columns="itemColumns"
                  :data="section.items"
                  searchable
                  max-height="40vh"
                />
              </q-card-section>
            </q-card>

            <q-card flat bordered>
              <q-card-section class="q-gutter-md">
                <div class="row q-col-gutter-lg">
                  <div class="col-12 col-md-6">
                    <div class="text-h6">Menge</div>
                    <div class="row q-col-gutter-md">
                      <div class="col-6">
                        <div class="text-subtitle2 text-positive">Positiv</div>
                        <div class="text-h5">{{ positiveQuantity }}</div>
                      </div>
                      <div class="col-6">
                        <div class="text-subtitle2 text-negative">Negativ</div>
                        <div class="text-h5">{{ negativeQuantity }}</div>
                      </div>
                    </div>
                  </div>
                  <div class="col-12 col-md-6">
                    <div class="text-h6">Betrag</div>
                    <div class="row q-col-gutter-md">
                      <div class="col-6">
                        <div class="text-subtitle2 text-positive">Positiv</div>
                        <div class="text-h5">{{ formatMoney(positiveTotal) }}</div>
                      </div>
                      <div class="col-6">
                        <div class="text-subtitle2 text-negative">Negativ</div>
                        <div class="text-h5">{{ formatMoney(negativeTotal) }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import type { Invoice } from '@s-core/talktogether';
import { datasource } from 'src/boot/di';
import TableComponent from 'src/components/TableComponent.vue';
import type { ColumnDesc, PropOrGetter } from 'src/components/table';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

type InvoiceItemView = {
  transaction_id: number;
  date: string;
  first: string;
  last: string;
  item_name: string;
  quantity: number;
  price: number;
  total: number;
  state: number;
};

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const invoice = ref<Invoice | null>(null);
const items = ref<InvoiceItemView[]>([]);
const groupedSections = ref<Array<{ invoice: Invoice; items: InvoiceItemView[] }>>([]);

const invoiceId = computed(() => Number(route.params.id));
const isGroupedInvoice = computed(() => Number(invoice.value?.invoice_type ?? 1) === 2);
const allItems = computed(() => {
  if (!isGroupedInvoice.value) {
    return items.value;
  }
  return groupedSections.value.flatMap((section) => section.items);
});
const totalItemCount = computed(() => allItems.value.length);

const itemColumns: ColumnDesc<InvoiceItemView, PropOrGetter<InvoiceItemView>>[] = [
  { headerName: 'Transaktion', property: 'transaction_id', sortable: true },
  { headerName: 'Datum', property: (row) => toLocaleDateTime(row.date), sortable: true, sortFunction: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() },
  { headerName: 'Verkaeufer', property: (row) => `${row.first} ${row.last}`, sortable: true },
  { headerName: 'Artikel', property: 'item_name', sortable: true },
  { headerName: 'Menge', property: 'quantity', sortable: true },
  { headerName: 'Preis', property: (row) => formatMoney(row.price), sortable: true, sortFunction: (a, b) => Number(a.price ?? 0) - Number(b.price ?? 0) },
  { headerName: 'Total', property: (row) => formatMoney(row.total), sortable: true, sortFunction: (a, b) => Number(a.total ?? 0) - Number(b.total ?? 0) },
  { headerName: 'Status', property: (row) => Number(row.state ?? 0) === 1 ? 'Invoiced' : 'Open', sortable: true },
];

const positiveQuantity = computed(() => {
  return allItems.value
    .filter((item) => Number(item.quantity ?? 0) > 0)
    .reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
});

const negativeQuantity = computed(() => {
  return allItems.value
    .filter((item) => Number(item.quantity ?? 0) < 0)
    .reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
});

const positiveTotal = computed(() => {
  return allItems.value
    .filter((item) => Number(item.total ?? 0) > 0)
    .reduce((sum, item) => sum + Number(item.total ?? 0), 0);
});

const negativeTotal = computed(() => {
  return allItems.value
    .filter((item) => Number(item.total ?? 0) < 0)
    .reduce((sum, item) => sum + Number(item.total ?? 0), 0);
});

watch(() => route.params.id, async () => {
  await loadInvoice();
}, { immediate: true });

async function loadInvoice() {
  if (!Number.isFinite(invoiceId.value) || invoiceId.value <= 0) {
    invoice.value = null;
    items.value = [];
    groupedSections.value = [];
    return;
  }

  loading.value = true;
  try {
    const invoiceResult = await datasource.find('Invoice', {
      where: [
        { function: '=', params: ['id', { value: invoiceId.value }] },
      ],
      limit: 1,
    });

    invoice.value = (invoiceResult?.[0] as Invoice | undefined) ?? null;

    if (!invoice.value) {
      items.value = [];
      groupedSections.value = [];
      return;
    }

    if (Number(invoice.value.invoice_type ?? 1) === 2) {
      items.value = [];
      await loadGroupedInvoiceDetails(invoice.value.id);
      return;
    }

    groupedSections.value = [];
    items.value = await loadInvoiceItems(invoiceId.value);
  } finally {
    loading.value = false;
  }
}

async function loadGroupedInvoiceDetails(groupInvoiceId: number | undefined) {
  if (typeof groupInvoiceId !== 'number') {
    groupedSections.value = [];
    return;
  }

  const members = await datasource.find('InvoiceGroupMember', {
    where: [
      { function: '=', params: ['group_invoice_id', { value: groupInvoiceId }] },
    ],
    limit: 5000,
  });

  const memberIds = (members as Array<{ member_invoice_id: number }>)
    .map((member) => Number(member.member_invoice_id))
    .filter((id) => Number.isFinite(id));

  if (memberIds.length === 0) {
    groupedSections.value = [];
    return;
  }

  const sections: Array<{ invoice: Invoice; items: InvoiceItemView[] }> = [];
  for (const memberId of memberIds) {
    const memberInvoiceResult = await datasource.find('Invoice', {
      where: [
        { function: '=', params: ['id', { value: memberId }] },
      ],
      limit: 1,
    });
    const memberInvoice = (memberInvoiceResult?.[0] as Invoice | undefined) ?? null;
    if (!memberInvoice) {
      continue;
    }
    const memberItems = await loadInvoiceItems(memberId);
    sections.push({
      invoice: memberInvoice,
      items: memberItems,
    });
  }

  groupedSections.value = sections;
}

async function loadInvoiceItems(targetInvoiceId: number): Promise<InvoiceItemView[]> {
  // First, get all invoice items for this specific invoice
  const invoiceItems = await datasource.find('InvoiceItem', {
    where: [
      { function: '=', params: ['invoice_id', { value: targetInvoiceId }] },
    ],
    limit: 2000,
  });

  if ((invoiceItems as unknown as Array<{ transaction_id: number }>).length === 0) {
    return [];
  }

  // Extract transaction IDs from the invoice items
  const transactionIds = (invoiceItems as unknown as Array<{ transaction_id: number }>)
    .map((item) => item.transaction_id)
    .filter((id) => Number.isFinite(id));

  if (transactionIds.length === 0) {
    return [];
  }

  // Get transaction details for these specific transaction IDs
  const itemResult = await datasource.select({ t: 'Transaction', s: 'Salesman', i: 'Item' }, {
    attributes: {
      transaction_id: 't.id',
      date: 't.date',
      quantity: 't.quantity',
      price: 't.price',
      total: 't.total',
      state: 't.state',
      first: 's.first',
      last: 's.last',
      item_name: 'i.name',
    },
    where: [
      { function: 'in', params: ['t.id', { value: transactionIds }] },
      { function: '=', params: ['s.id', 't.salesman'] },
      { function: '=', params: ['i.id', 't.item'] },
    ],
    orderBy: [['t.date', 'desc']],
    limit: 2000,
  });

  return itemResult;
}

function goBack() {
  router.push({ name: 'invoices' }).catch((error: unknown) => console.error(error));
}

function getInvoiceStateLabel(targetInvoice: Invoice | null): string {
  if (!targetInvoice) {
    return 'Offen';
  }
  if (Number(targetInvoice.invoice_type ?? 1) === 2) {
    return 'Gruppiert';
  }
  const stateNum = Number(targetInvoice.state ?? 0);
  if (stateNum === 1) {
    return 'Abgeschlossen';
  }
  if (stateNum === 9) {
    return 'Zusammengefasst';
  }
  return 'Offen';
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
