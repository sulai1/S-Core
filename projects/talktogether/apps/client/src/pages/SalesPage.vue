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
      <div class="text-subtitle2 q-mb-sm">Transaktion erfassen</div>
      <div class="transaction-panel">
        <TransactionComponent
          v-model:transaction="transaction"
          :items="items"
          :salesman="selectedSalesman?.id ?? null"
          @commit="addTransaction"
          id="transaction-component"
        />
      </div>
    </div>
    <div class="col-12 col-md-5 q-pa-md">
      <FindSalesman v-model="selectedSalesman" :salesmen="salesmen">
      </FindSalesman>
    </div>
  </div>
</template>

<script setup lang="ts">

import type { Item, Transaction } from '@s-core/talktogether';
import { datasource } from 'src/boot/di';
import type { SalesmanView } from 'src/components/FindSalesman.vue';
import FindSalesman from 'src/components/FindSalesman.vue';
import TransactionComponent from 'src/components/TransactionComponent.vue';
import {  onMounted, ref } from 'vue';

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


// Keep a stable object reference so child inputs aren't reset by re-assignment
const transaction = ref<Transaction>({
  date: new Date().toISOString(),
  item: null as unknown as number, // will hold item id
  salesman: null as unknown as number, // will hold salesman id
  price: 0,
  quantity: 0,
  total: 0,
  id: 0
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
    limit: 5
  });

  transactions.value = res as unknown as Transaction[];
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
