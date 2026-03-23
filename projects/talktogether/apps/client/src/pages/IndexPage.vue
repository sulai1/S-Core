<template>
  <q-page class="row q-col-gutter-md justify-evenly">
    <div class="col-12 col-md-3 order-1 order-md-1">
      <div id="salesman" style="position:sticky; top:5vh; align-self:flex-start; z-index:1; overflow-y:auto; max-height:95vh;">
        <SalesmanComponent v-if="selectedSalesman" v-model="selectedSalesman">
          <q-btn v-if="selectedSalesman" label="Anwenden" @click="updateSalesman(selectedSalesman)" />
          <q-btn v-if="selectedSalesman" label="Löschen" @click="deleteSalesman(selectedSalesman)" />
        </SalesmanComponent>
      </div>
    </div>
    <div class="col-12 col-md-6 order-3 order-md-3">
      <TableComponent
        :data="salesmen"
        id="salesmen"
        :columns="columns"
        v-model:selected="selectedSalesman"
        :row-class="rowColor"
        searchable
      >
        <template v-slot:toolbar>
          <q-btn label="Hinzufügen" @click="addSalesman()" />
        </template>
      </TableComponent>
    </div>
    <div class="col-12 col-md-3 order-2 order-md-2">
      <div id="print-sidebar" style="position:sticky; top:5vh; align-self:flex-start; z-index:1; overflow-y:auto; max-height:95vh;">
        <PrintComponent v-model="printList">
          <template v-slot:actions>
            <q-btn v-if="selectedSalesman" icon="add" @click="addToPrintList(selectedSalesman)" />
          </template>
        </PrintComponent>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { datasource } from 'src/boot/di';
import AddSalesman from 'src/components/AddSalesman.vue';
import PrintComponent from 'src/components/PrintComponent.vue';
import SalesmanComponent from 'src/components/SalesmanComponent.vue';
import type { ColumnDesc, PropOrGetter } from 'src/components/table';
import TableComponent from 'src/components/TableComponent.vue';
import { onMounted, ref } from 'vue';
import type { Salesman } from '@s-core/talktogether';

const columns:ColumnDesc<Salesman,PropOrGetter<Salesman>>[] = [
  {headerName:'Id', property:'id', sortable:true, sortFunction:(a,b)=> (a.id ?? 0) - (b.id ?? 0)},
  {headerName:'Lastname', property:'last', sortable:true},
  {headerName:'Firstname', property:'first', sortable:true},
  {headerName:'createdAt',
   property:(row)=> row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '',
   sortable:true,
   sortFunction:(a,b)=>{
     if(!a.createdAt) return -1;
     if(!b.createdAt) return 1;
     return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
   }
  },
  {
    headerName:'updatedAt',
    property:(row)=> row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '',
    sortable:true,
    sortFunction:(a,b)=>{
     if(!a.updatedAt) return -1;
     if(!b.updatedAt) return 1;
     return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
   }},
]

const selectedSalesman = ref<Salesman|null>(null);
const salesmen = ref<Salesman[]>([]);
const printList = ref<Salesman[]>([]);

onMounted(async () => {
  const res = await datasource.find("Salesman", {
    orderBy: [['updatedAt', 'desc'], ['id', 'desc']],
  });
  if (res) {
    salesmen.value = res as unknown as Salesman[];
  }
});

const updateSalesman = async (salesman?: Salesman) => {
  if(typeof salesman?.id === "undefined"){
    alert("id is required");
    return;
  };

  await datasource.update("Salesman", salesman, [{ function:"=",params:["id",{value:salesman.id}]}] );
};

const deleteSalesman =  (salesman?: Salesman) => {
  if(typeof salesman?.id === "undefined"){
    alert("id is required");
    return;
  };

  $q.dialog({
          title: 'Verkäufer löschen',
          message: `Verkäufer ${salesman.first} ${salesman.last} wirklich löschen?`,
          ok: 'OK',
          cancel: 'Abbrechen',
          persistent: true
  }).onOk(() => {
    if(!salesman?.id) return;
    datasource.delete("Salesman", [{ function:"=",params:["id",{value:salesman.id}]}] ).catch((e: unknown)=> console.error(e));
    salesmen.value = salesmen.value.filter((s:Salesman) => s.id !== salesman.id);
  });
};


const $q = useQuasar();
function addSalesman () {
      $q.dialog({
        component: AddSalesman,
      }).onOk(data => {
        datasource.find("Salesman", {
          where: [
            { function: '=', params: ["first",{ value: data.first }] },
            { function: '=', params: ["last",{ value: data.last }] },
          ],
          limit: 1,
          orderBy: [['updatedAt', 'desc'], ['id', 'desc']],
        }).then((res: unknown[])=>{
          if(res){
            if( res[0]){
              salesmen.value = [res[0] as unknown as Salesman,...salesmen.value];
            }else{
              alert("Salesman not found");
            }
          }else{
            alert("Error creating salesman: "+JSON.stringify(res));
          }
        }).catch((e: Error)=>{
          alert(e.message);
        });
      });
    }

function addToPrintList(salesman?: Salesman){
  console.log("addToPrintList", salesman);
  if(!salesman) return;
  if(!printList.value.find((s:Salesman) => s.id === salesman.id)){
    printList.value = [salesman,...printList.value];
  }
  // ensure unique entries
  printList.value = [...new Set(printList.value)];
}

function rowColor(row: Salesman) {
  return row.message?.toLowerCase().includes("sperr") ? 'bg-red-3' : '';
}

</script>

<style scoped>
.slide-enter-active, .slide-leave-active {
  transition: max-width 0.3s, opacity 0.3s;
}
.slide-enter-from, .slide-leave-to {
  max-width: 0;
  opacity: 0;
}
.slide-enter-to, .slide-leave-from {
  max-width: 400px;
  opacity: 1;
}
@media (max-width: 600px) {
  #salesman, #print-sidebar {
    position: static !important;
    max-width: 100vw !important;
    margin-bottom: 12px;
  }
}
#salesman{
  align-self:flex-start;
  z-index:1;
}
#salesmen{
  align-self:flex-start;
  z-index:1;
  overflow: auto;
}
#printList{
  align-self:flex-start;
  z-index:1;
}

.bg-red-3 {
  background-color: rgba(203, 5, 5, 0.93) !important;
}

</style>
