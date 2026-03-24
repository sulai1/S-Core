<template>
    <div class="row no-wrap">
            <TableComponent
                :columns="columns"
                :data="items"
                searchable
                v-model:selected="selectedItem"
                >

              <template v-slot:toolbar>
                <q-btn label="Add Item" @click="addItem" />
              </template>
            </TableComponent>

        <q-drawer
            side="right"
            elevated
            :width="360"
            v-model="drawerOpen"
            overlay
            bordered>
            <q-toolbar class="q-pa-sm">
                <q-toolbar-title>{{ create ? 'Create Item' : 'Edit Item' }}</q-toolbar-title>
                <q-btn dense flat icon="close" @click="closeEditor" />
            </q-toolbar>

            <q-form @submit.prevent="saveItem" class="q-pa-md scroll">
                <q-input v-model="editItem.name" label="Name" dense outlined class="q-mb-md" />
                <q-input v-model="editItem.description" label="Description" type="textarea" autogrow dense outlined class="q-mb-md" />
                <q-input v-model="editItem.edition" label="Edition" dense outlined class="q-mb-md" />
                <q-input v-model.number="editItem.cost" label="Cost" type="number" dense outlined class="q-mb-md" />
                <q-input v-model.number="editItem.price" label="Price" type="number" dense outlined class="q-mb-md" />
                <q-input
                    v-model="validTo"
                    label="Valid To"
                    type="date"
                    dense
                    outlined
                    class="q-mb-md"
                    :rules="[ val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val) || 'Invalid date format (YYYY-MM-DD)']"
                    />
                <div class="row q-gutter-sm">
                    <q-btn label="Save" color="primary" type="submit" :loading="saving" />
                    <q-btn label="Cancel" flat color="primary" @click="closeEditor" />
                </div>
            </q-form>
        </q-drawer>
    </div>
</template>

<script setup lang="ts">

import { datasource } from 'src/boot/di';
import TableComponent from 'src/components/TableComponent.vue';
import { onMounted, ref, watch } from 'vue';
import { type ColumnDesc, type PropOrGetter } from 'src/components/table';
import {useQuasar } from 'quasar';
import type { Item } from '@s-core/talktogether';

const $q = useQuasar();

const validTo = ref<string | null>(null);
const items = ref<Item[]>([]);
const columns = ref<ColumnDesc<Item,PropOrGetter<Item>>[]>([
  { headerName: 'Id', property: 'id', sortable: true },
  { headerName:'Name', property: 'name'},
  { headerName:'Beschreibung', property: 'description'},
  { headerName:'Edition', property: 'edition'},
  { headerName: 'Kosten', property:'cost' },
  { headerName: 'Preis', property:'price' },
  { headerName: 'Stück', property:'quantity' },
  { headerName: 'Gültig bis', property:(row)=> row.validTo ? new Date(row.validTo).toLocaleDateString() : '' , sortable:true,
    sortFunction:(a,b)=>{
      if(!a.validTo) return -1;
      if(!b.validTo) return 1;
      return new Date(a.validTo).getTime() - new Date(b.validTo).getTime();
    }
  },
  { headerName: 'Erstellt', property:(row)=> row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '' , sortable:true,
    sortFunction:(a,b)=>{
      if(!a.createdAt) return -1;
      if(!b.createdAt) return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
  },
  { headerName: 'Aktualisiert', property:(row)=> row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '' , sortable:true,
    sortFunction:(a,b)=>{
      if(!a.updatedAt) return -1;
      if(!b.updatedAt) return 1;
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }
  },
  { headerName: 'Gültig bis', property:(row)=> row.validTo ? new Date(row.validTo).toLocaleDateString() : '' , sortable:true,
    sortFunction:(a,b)=>{
      if(!a.validTo) return -1;
      if(!b.validTo) return 1;
      return new Date(a.validTo).getTime() - new Date(b.validTo).getTime();
    }
  },
]);

// Editor state
const drawerOpen = ref(false);
const selectedItem = ref<Item | null>(null);
const editItem = ref<Partial<Item>>({});
const saving = ref(false);
const create = ref(false);

watch(selectedItem, async(newVal) => {
  if (newVal) {
    openEditor();
    create.value = false;
  } else {
    create.value = false;
    await closeEditor();
  }
});

function addItem() {
  create.value = true;
  openEditor();
  selectedItem.value = null;
}

async function closeEditor() {
  drawerOpen.value = false;
  editItem.value = {};
  selectedItem.value = null;
  await list();
}

function openEditor() {
  validTo.value = String(selectedItem.value?.validTo);
  editItem.value = { ...selectedItem.value,
   }; // shallow clone
  drawerOpen.value = true;
}

async function saveItem() {
  if(!editItem.value.name || editItem.value.name.trim() === '') {
    $q.notify({ message: 'Name is required', color: 'negative' });
    return;
  }
  editItem.value.validTo = (validTo.value ? new Date(validTo.value) : new Date()).toISOString();
  editItem.value.updatedAt = new Date().toISOString();

  if(create.value || !selectedItem.value) {
    // Create new
    await createItem();
  } else {
    // Update existing
    await updateItem();
  }
}

const createItem = async () => {
  editItem.value.createdAt = new Date().toISOString();
  saving.value = true;
  const res = await datasource.insert("Item",[editItem.value as Item]);
  saving.value = false;

  if (res) {
    await closeEditor();
    $q.notify({ message: 'Item created', color: 'positive' });
  } else {
    $q.notify({ message: JSON.stringify(res), color: 'negative' });
  }
};

const updateItem = async () => {
  if(!editItem.value.id) {
    $q.notify({ message: 'Item ID is missing', color: 'negative' });
    return;
  }
  saving.value = true;
  await datasource.update("Item", editItem.value as Item, [{ function:"=", params: ["id", { value: editItem.value.id }]}] );
  saving.value = false;

  await closeEditor();
};

onMounted(async () => {
  await list();
});


async function list() {
  const res = await datasource.find("Item", {orderBy: [['id', 'desc']]});
  if (res) {
    items.value = res as unknown as Item[];
  }
}
</script>

<style scoped lang="scss">
// optional styles
</style>
