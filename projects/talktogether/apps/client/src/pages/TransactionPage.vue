<template>
  <div class="row q-pa-md">
    <div class="col-12 col-md-9 q-pa-md">
      <div class="row q-col-gutter-sm items-end q-mb-md">
        <div class="col-12 col-sm-3">
          <q-input v-model="dateFrom" type="date" label="Von" dense />
        </div>
        <div class="col-12 col-sm-3">
          <q-input v-model="dateTo" type="date" label="Bis" dense />
        </div>
        <div class="col-12 col-sm-3">
          <q-checkbox v-model="onlyOpen" label="Nur offene Transaktionen" />
        </div>
        <div class="col-12 col-sm-3">
          <q-btn color="primary" icon="filter_alt" label="Filtern" @click="list" />
        </div>
      </div>
      <div class="q-mt-md table-scroll-wrapper" >
        <TableComponent 
          :columns="columns"
          :data="filteredTransactions"
          :style="scrollStyle">
          <template v-slot:after-row="{ row }">
            <td colspan="100%">
              <q-btn size="sm" flat color="primary" icon="delete" @click="cancel(row)" />
            </td>
          </template>
          
        </TableComponent>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

import type { Transaction } from '@s-core/talktogether';
import { useQuasar } from 'quasar';
import { datasource } from 'src/boot/di';
import { type ColumnDesc, type PropOrGetter } from 'src/components/table';
import TableComponent from 'src/components/TableComponent.vue';
import { computed, onMounted, ref } from 'vue';

const $q = useQuasar();

type TransactionWithNames = Transaction & { first: string, last: string, item: string };

const transactions = ref<TransactionWithNames[]>([]);
const dateFrom = ref('');
const dateTo = ref('');
const onlyOpen = ref(false);

const filteredTransactions = computed(() => {
  if (!onlyOpen.value) {
    return transactions.value;
  }
  return transactions.value.filter((transaction) => Number(transaction.state ?? 0) === 0);
});


const columns = ref<ColumnDesc<TransactionWithNames,PropOrGetter<TransactionWithNames>>[]>([
  { headerName: 'Vorname', property: 'first', sortable: true},
  { headerName: 'Nachname', property: 'last', sortable: true},
  { headerName: 'Artikel', property: 'item', sortable: true},
  { headerName: 'Stück', property:'quantity' },
  { headerName: 'Gesamt', property:'total' },
  { headerName: 'Preis', property:'price' },
  { headerName: 'date',
    property: (row) => row.date ? new Date(row.date).toLocaleString() : '', sortable: true,
    sortFunction: (a,b)=>new Date(a.date??0).getTime() - new Date(b.date??0).getTime()
  },
]);

const scrollStyle = computed(() => {
  // Use Quasar's breakpoint plugin for responsive height
  if ($q.screen.lt.md) {
    return 'max-height: 240px;';
  }
  return 'max-height: 480px;';
});

onMounted(async () => {
  await list();
});
async function list() {

  const res = await datasource.select({t:"Transaction", s:"Salesman", i:"Item"}, {
    attributes:{
      id:"t.id",
      date:"t.date",
      item:"i.name",
      quantity:"t.quantity",
      total:"t.total",
      price:"t.price",
      state:"t.state",
      first: "s.first",
      last:  "s.last",
      salesmen:"t.salesman"
    },
    where: [
      { function: "=", params: ["s.id", "t.salesman"] },
      { function: "=", params: ["i.id", "t.item"] },
      { function: "between", params: ["t.date", 
        dateFrom.value ? { value: `${dateFrom.value}T00:00:00.000Z` } : { value: '1970-01-01T00:00:00.000Z' },
        dateTo.value ? { value: `${dateTo.value}T23:59:59.999Z` } : { value: new Date().toISOString() }
      ] }
  ] ,
    orderBy : [['t.date', 'desc']],
    limit: 500
  });

  transactions.value = res as unknown as TransactionWithNames[];
}

async function cancel(t: Transaction) {
  if(!t.id) {
    alert("Transaction has no ID");
    return;
  }
  if(!confirm("Wirklich löschen?")) {
    return;
  }
  await datasource.delete("Transaction",[{function:"=", params: ["id", {value:t.id}]}]);
  await list();
}
</script>

<style scoped>
#transaction-component {
  border: 3px solid var(--q-primary);
  border-radius: 12px;
}

.transaction-panel {
  display: block;
  width: 100%;
  margin-top: 8px;
}
.responsive-table {
  font-size: 1em;
  max-width: 100%;
}
@media (max-width: 600px) {
  .transaction-panel {
    min-height: 120px;
  }

  #transaction-component {
    margin-top: 8px;
    margin-bottom: 8px;
  }

  .table-scroll-wrapper {
    max-height: 220px;
    overflow-y: auto;
  }
}
</style>
