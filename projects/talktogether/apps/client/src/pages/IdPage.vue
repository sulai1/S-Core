<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-12 col-sm-4 col-md-3">
        <q-input
          v-model="validAt"
          type="date"
          label="Gültig am"
          dense
          clearable
        />
      </div>
      <div class="col-auto flex items-center text-grey-7">
        {{ ids.length }} Einträge
      </div>
    </div>

    <TableComponent
      :columns="columns"
      :data="ids"
      searchable
    />
  </q-page>
</template>

<script setup lang="ts">

import { datasource } from 'src/boot/di';
import { type ColumnDesc, type PropOrGetter } from 'src/components/table';
import TableComponent from 'src/components/TableComponent.vue';
import { ref, watch } from 'vue';

type SalesmanView = {
  id: number,
  id_nr: number,
  salesman: string,
  last: string,
  first: string,
  createdAt: string,
  validTo: string
}

const ids = ref<SalesmanView[]>([]);
const validAt = ref(new Date().toISOString().split('T')[0]);

const columns = ref<ColumnDesc<SalesmanView,PropOrGetter<SalesmanView>>[]>([
  { headerName: 'Id', property: 'id', sortable: true, sortFunction:(a,b)=> a.id  - b.id },
  { headerName:'Ausweis', property: 'id_nr', sortable: true, sortFunction:(a,b)=> a.id_nr  - b.id_nr  },
  { headerName: 'Verkäufer', property:'salesman' },
  { headerName: 'Nachname', property:'last', sortable:true },
  { headerName: 'Vorname', property:'first', sortable:true },
  { headerName: 'Erstellt am',
    property: (row) => row["createdAt"] ? new Date(row["createdAt"]).toLocaleDateString() : '',
    sortable: true,
    sortFunction: (a,b)=>new Date(a["createdAt"]??0).getTime() - new Date(b["createdAt"]??0).getTime()  },
  { headerName: 'Gültig bis',
    property: (row) => row["validTo"] ? new Date(row["validTo"]).toLocaleDateString() : '', sortable: true,
    sortFunction: (a,b)=>new Date(a["validTo"]??0).getTime() - new Date(b["validTo"]??0).getTime()  },
]);

watch(validAt, async (selectedDate) => {
  const whereFilters: Array<{ function: string; params: unknown[] }> = [
    { function: '=', params: ['Identification.salesman', 'Salesman.id'] },
  ];

  if (selectedDate) {
    whereFilters.push({
      function: '>=',
      params: ['Identification.validTo', { value: `${selectedDate}T00:00:00.000Z` }],
    });
  }

  const res = await datasource.select({Identification:"Identification", Salesman:"Salesman"},{
    attributes: {
      id:"Identification.id",
      id_nr:"Identification.id_nr",
      salesman:"Salesman.id",
      last:"Salesman.last",
      first:"Salesman.first",
      createdAt:"Identification.createdAt",
      validTo:"Identification.validTo"
    },
    where: [
      {function: "=", params: ['Identification.salesman', 'Salesman.id']},
      {function: 'between', ignoreIfParamIsNull: true, params: [selectedDate ? { value: `${selectedDate}T00:00:00.000Z` } : "Identification.createdAt",'Identification.createdAt', 'Identification.validTo']},
    ],
    orderBy: [['Identification.validTo', 'desc'], ['Identification.id_nr', 'asc']],
  });
  if (res) {
    ids.value = res;
  }
}, { immediate: true });
</script>
