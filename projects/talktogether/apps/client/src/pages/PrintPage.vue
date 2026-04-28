<template>
  <q-page class="row q-col-gutter-md q-pa-md">
    <div class="col-12 col-lg-7">
      <q-card class="finder-card">
        <q-card-section>
          <div class="text-h6 q-mb-md">Verkäufer für Ausweise auswählen</div>
          <FindSalesman v-model="selectedSalesman" :salesmen="salesmen" />
        </q-card-section>
      </q-card>
    </div>

    <div class="col-12 col-lg-5">
      <div class="print-panel">
        <PrintComponent v-model="printList">
          <template #actions>
            <q-btn
              icon="add"
              color="primary"
              label="Hinzufügen"
              :disable="!selectedSalesman?.id"
              @click="addToPrintList(selectedSalesman)"
            />
          </template>
        </PrintComponent>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { datasource } from 'src/boot/di';
import FindSalesman from 'src/components/FindSalesman.vue';
import PrintComponent from 'src/components/PrintComponent.vue';

type PrintableSalesman = {
  id: number;
  id_nr: number;
  first: string;
  last: string;
  phone?: string;
  image: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  validTo: string;
  locked?: boolean;
};

const emptySalesman: PrintableSalesman = {
  id: 0,
  id_nr: 0,
  first: '',
  last: '',
  phone: '',
  image: '',
  message: '',
  createdAt: '',
  updatedAt: '',
  validTo: '',
  locked: false,
};

const $q = useQuasar();
const salesmen = ref<PrintableSalesman[]>([]);
const selectedSalesman = ref<PrintableSalesman>(emptySalesman);
const printList = ref<PrintableSalesman[]>([]);

onMounted(async () => {
  const resSalesman = await datasource.select({ s: 'Salesman', i: 'Identification' }, {
    attributes: {
      id: 's.id',
      id_nr: 'i.id_nr',
      first: 's.first',
      last: 's.last',
      phone: 's.phone',
      image: 's.image',
      message: 's.message',
      createdAt: 's.createdAt',
      updatedAt: 's.updatedAt',
      validTo: 'i.validTo',
      locked: 's.locked',
    },
    orderBy: [['i.id_nr', 'asc']],
    where: [
      { function: '>=', params: ['i.validTo', { value: new Date().toISOString() }] },
      { function: '=', params: [{function:"coalesce", params: ['i.salesman', 's.id']}, 's.id'] },
    ],
  });
 
  salesmen.value = resSalesman;
  if (!selectedSalesman.value.id && salesmen.value.length > 0) {
    selectedSalesman.value = salesmen.value[0] as PrintableSalesman;
  }
});

function addToPrintList(salesman?: PrintableSalesman) {
  if (!salesman?.id) {
    return;
  }

  if (salesman.locked) {
    $q.dialog({
      title: 'Error',
      message: 'Error salesman locked',
    });
    return;
  }

  if (!printList.value.find((entry) => entry.id === salesman.id)) {
    printList.value = [salesman, ...printList.value];
  }
}
</script>

<style scoped>
.finder-card,
.print-panel {
  height: 100%;
}

@media (min-width: 1024px) {
  .print-panel {
    position: sticky;
    top: 16px;
  }
}
</style>
