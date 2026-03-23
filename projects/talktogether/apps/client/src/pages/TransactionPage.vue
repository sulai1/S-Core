<template>
  <div class="row q-pa-md">
    <div class="col-12 col-md-7 q-pa-md" style="max-width: 100%;" >
      <div class="row" style="width: 100%;">
        <div class="col-6">
          <q-select v-model="item" data-testid="item" label="Item" class="q-mb-md" style="width: 100%;"
            :options="items" :option-label="(o) => o.name + ' ' + o.edition" option-value="id" dense/>
        </div>
        <div class="col-6">
          <q-field label="Lagerbestand" class="q-mb-md"  stack-label dense style="min-width: 100px;" readonly >
            {{ item?.quantity }}
          </q-field>
        </div>
      </div>

      <FindSalesman v-model="selectedSalesman" :salesmen="salesmen">
      </FindSalesman>

    </div>
    <div class="col-12 col-md-5 q-pa-md">
      <div class="q-mt-md table-scroll-wrapper" >
        <div class="transaction-panel">
          <div class="text-subtitle2 q-mb-sm">Transaktion erfassen</div>
          <TransactionComponent
            v-model:transaction="transaction"
            :items="items"
            :salesman="selectedSalesman?.id ?? null"
            @commit="addTransaction"
            id="transaction-component"
          />
        </div>
        <TableComponent 
          :columns="columns"
          :data="transactions"
          :style="scrollStyle">
          <template v-slot:after-row="{ row }">
            <td colspan="100%">
              <q-btn size="sm" flat color="primary" icon="delete" @click="cancel(row)" />
            </td>
          </template>
          <template v-slot:cell="{ value, column }">
            <q-btn v-if="column?.property==='salesman'" flat class="text-primary" @click="findSalesman(value)">
              {{ value }}
            </q-btn>
            <q-btn v-else-if="column?.property==='item'" flat class="text-primary" @click="findItem(value)">
              {{ value }}
            </q-btn>
            <span  v-else>
              {{ value }}
            </span>
            </template>
        </TableComponent>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

import type { Item, Transaction } from '@s-core/talktogether';
import { useQuasar } from 'quasar';
import { datasource } from 'src/boot/di';
import type { SalesmanView } from 'src/components/FindSalesman.vue';
import FindSalesman from 'src/components/FindSalesman.vue';
import { type ColumnDesc, type PropOrGetter } from 'src/components/table';
import TableComponent from 'src/components/TableComponent.vue';
import TransactionComponent from 'src/components/TransactionComponent.vue';
import { computed, onMounted, ref } from 'vue';

const $q = useQuasar();

const transactions = ref<Transaction[]>([]);
const selectedSalesman = ref<SalesmanView>({
  first: "",
  last: "",
  id: 0,
  id_nr: 0,
  message: "",
  validTo: "",
  image: "",
});


const columns = ref<ColumnDesc<Transaction,PropOrGetter<Transaction>>[]>([
  { headerName: 'Verkäufer', property:'salesman', cellClass: () => 'text-primary',
    onClick: async (e,row)=> {
      const salesman: SalesmanView[] = await datasource.select({s:"Salesman", i:"Identification"}, {
        attributes:{
          id:"s.id",
          id_nr:"i.id_nr",
          first:"s.first",
          last:"s.last",
          message:"s.message",
          validTo:"i.validTo",
          image:"s.image"
        },
         where: [
          {function:"=", params: ["s.id", {value:row.salesman}]},
          {function:"=", params: ["i.salesman", {value:row.salesman}]},
          {function:">=", params: ["i.validTo", {value:new Date().toISOString()}]}
        ],
      });
      if(salesman && salesman[0]) {
        selectedSalesman.value =  salesman[0];
      }
    }
  },
  { headerName: 'Artikel', property: 'item', sortable: true },
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


// Keep a stable object reference so child inputs aren't reset by re-assignment
const transaction = ref<Transaction>({
  date: new Date().toISOString(),
  item: null as unknown as number, // will hold item id
  salesman: null as unknown as number, // will hold salesman id
  price: 0,
  quantity: 0,
  total: 0,
  id: ""
});

const salesmen = ref<SalesmanView[]>([]);
const items = ref<Item[]>([]);
const item = ref<Item >();

onMounted(async () => {

  await list();

  const resItem = await datasource.find("Item", {
    where:[ {function:">=", params: ["validTo", { value:new Date().toISOString()}]} ],
    orderBy: [['name', 'asc']],
  });

  items.value = resItem as unknown as Item[];
  item.value = items.value.length > 0 ? items.value[0] : {} as Item;

  const resSalesman = await datasource.select({s:"Salesman", i:"Identification"}, {
    attributes: {
      id:"s.id",
      id_nr:"i.id_nr",
      first:"s.first",
      last:"s.last",
      message:"s.message",
      validTo:"i.validTo",
      image:"s.image"
    },
    orderBy: [['i.id_nr', 'asc']],
    where: [
      {function:">=", params: ["i.validTo", { value:new Date().toISOString()}]},
      {function:"=", params: ["s.id", "i.salesman"]}
    ]
  });
  salesmen.value = resSalesman;
});

async function list() {
  const res = await datasource.find("Transaction", {
    orderBy : [['date', 'desc']],
    limit: 100
  });

  transactions.value = res as unknown as Transaction[];
}

function findSalesman(id: number) {
  const salesman = salesmen.value.find((s: SalesmanView) => s.id === id);
  if(salesman) {
    selectedSalesman.value = salesman ;
  }
}

function findItem(id: number) {
  const foundItem = items.value.find((i: Item) => i.id === id);
  if(foundItem) {
    item.value = foundItem;
  }
}

async function addTransaction(t: Transaction) {
  const res = await datasource.insert("Transaction",[{
    ...t,
  }]);
  if (res) {
    await list();
    // Reset fields without replacing the object reference (avoids input reset flicker)
    Object.assign(transaction.value, {
      date: new Date(),
      item: null,
      salesman: null,
      price: 0,
      quantity: 0,
    });
  } else {
    alert('Fehler beim Anlegen der Transaktion: ' + JSON.stringify(res));
  }
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
