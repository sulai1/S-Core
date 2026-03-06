<template>
    <TableComponent
        :columns="columns"
        :data="ids"
        searchable>
    </TableComponent>
</template>

<script setup lang="ts">

import { datasource } from 'src/boot/di';
import { type ColumnDesc, type PropOrGetter } from 'src/components/table';
import TableComponent from 'src/components/TableComponent.vue';
import { onMounted, ref } from 'vue';

type SalesmanView = {
  id: number,
  id_nr: number,
  salesman: string,
  last: string,
  first: string,
  createdAt: string,
  updatedAt: string
}

const ids = ref<SalesmanView[]>([]);
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
    property: (row) => row["updatedAt"] ? new Date(row["updatedAt"]).toLocaleDateString() : '', sortable: true,
    sortFunction: (a,b)=>new Date(a["updatedAt"]??0).getTime() - new Date(b["updatedAt"]??0).getTime()  },
]);

onMounted(async () => {
  const res = await datasource.select({Identification:"Identification", Salesman:"Salesman"},{
    attributes: {
      id:"Identification.id",
      id_nr:"Identification.id_nr",
      salesman:"Salesman.id",
      last:"Salesman.last",
      first:"Salesman.first",
      createdAt:"Identification.createdAt",
      updatedAt:"Identification.updatedAt"
    },
    where: [{  function: '=', params: ['Identification.salesman','Salesman.id'] }],
    orderBy: [['Identification.updatedAt', 'desc'], ['Identification.id_nr', 'asc']],
  });
  if (res) {
    ids.value = res ;
  }
});
</script>
