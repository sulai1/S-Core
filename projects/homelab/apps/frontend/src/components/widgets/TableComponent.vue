<template>
  <table>
    <q-toolbar v-if="searchable || !!$slots.toolbar">
      <q-input
          v-if="searchable"
          type="text"
          class="form-control"
          placeholder="Search..."
          v-model="searchString"
          style="width: 100%;"
      />
      <slot name="toolbar">
      </slot>
    </q-toolbar>
    <q-virtual-scroll
      type="table"
      :virtual-scroll-item-size="48"
      :virtual-scroll-sticky-size-start="48"
      :virtual-scroll-sticky-size-end="32"
      :items="filteredSortedData"
      @keydown="handleKeydown"
      tabindex="0"
      id="table-scroll"
      :style="{maxHeight}"
      >
      <template v-slot:before>
        <thead class="thead-sticky text-left">
          <slot name="header">
            <tr :class="[{headerRowClass}, props.dense ? 'dense-row' : '']">
              <th v-for="(column, index) in computedColumns"
                :key="index"
                @click="() => sortBy(column.headerName,column.property,column.sortFunction)"
              >
              <div class="row">
                {{ column.headerName }}
              </div>
              <small v-if="sorting.find(el=>el.name == column.headerName)">
                  <small v-if="sorting.length>1">
                    <small>
                        {{ sorting.findIndex(el=>el.name == column.headerName)  }}
                    </small>
                  </small>
                  <q-icon size="xs" :name="sorting.find(el=>el.name == column.headerName)?.order === 'asc' ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"/>
                </small>
              </th>
            </tr>
          </slot>
        </thead>
      </template>
      <template v-slot="{ item: row }">
        <tr :class="[
            { selected: selected === row },
            'dense-row',
            typeof props.rowClass === 'function' ? props.rowClass(row) : props.rowClass
          ]"
          @click="() => onRowClick(row)"
        >
          <td v-for="({property }, index) in computedColumns"
            :key="index"
            :class="getCellClass(index, row)"
            @click="props.columns?.[index]?.onClick"
            >
            <slot
              name="cell"
              :value="getColumnValue(property, row)"
              :row="row"
              :column="props.columns?.[index]"
              :cellindex="index"
              :columnName="getColumnName(index, row)"
            >
             <primitive-component
                :value="getColumnValue(property, row)"
                :type="props.columns?.[index]?.type"
              />
            </slot>
          </td>
          <slot name="after-row" :row="row"></slot>
        </tr>
      </template>
    </q-virtual-scroll>

    <q-dialog v-model="dialogOpen" persistent class="object-popup">
      <q-card class="object-card" style="min-width: 320px; max-width: 90vw;">
        <q-card-section class="object-card-section">
          <div v-if="selectedRow" class="object-card-body">
            <ObjectComponent :obj="selectedRow"  />
          </div>
        </q-card-section>
        <q-card-actions align="right" class="object-card-actions">
          <q-btn flat label="Close" class="object-close-btn" @click="closePopup" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </table>
</template>

<script setup lang="ts" generic="T extends object">
import { computed, onMounted, ref, shallowRef, watch } from 'vue';
import type { ColumnDesc, PropOrGetter, SortFunction } from '../../models/table';
import ObjectComponent from './ObjectComponent.vue';
import PrimitiveComponent from './PrimitiveComponent.vue';


const props = defineProps<{
    data:T[],
    columns?:ColumnDesc<T,keyof T>[]
    headerRowClass?:string,
    rowClass?:string|((row:T) => string),
    searchable?:boolean
    maxHeight?:string,
    dense?:boolean
}>();

const hideColumns = ref<{ [K in keyof T]?: boolean }>({});
const computedColumns = computed< ColumnDesc<T,keyof T>[]>(() => {
    if (props.columns && props.columns.length > 0) {
      return props.columns;
    }
    const c =  [] as ColumnDesc<T,keyof T>[];
    for(const key in props.data[0] ?? {}){
      if(hideColumns.value[key as keyof T]){
        continue;
      }
      c.push({property: key as keyof T, headerName: key});
    }
    return c;
});

const selected = defineModel<T|null>("selected");
const currentIndex = defineModel<number>("selectedIndex", {default: -1});

const sorting = ref<{name:string, f:SortFunction<T>, order:"desc"|"asc"}[]>([]);
const filteredSortedData = shallowRef<T[]>([]);
const searchString = ref<string>('');
const dialogOpen = ref(false);
const selectedRow = ref<T|null>(null);

onMounted(() => {
  filteredSortedData.value = [...props.data];
});

watch(()=>props.data, (newSalesmen) => {
  filteredSortedData.value = newSalesmen;
},{deep:true});


watch(searchString, (newSearch,oldSearch) => {
  if(newSearch === ''){
    filteredSortedData.value = props.data;
    sortTable();
    return;
  }else if (oldSearch !== newSearch){
    filter(newSearch);
    sortTable();
  }
},{deep:true});

function filter(text: string) {
  if (!text) {
    filteredSortedData.value = props.data;
    return;
  }
  filteredSortedData.value = [...props.data].filter((row) => {
    return props.columns?.map(col=>typeof col.property === "function" ? col.property(row) : row[col.property]).some((value) => {
      return value?.toString().toLowerCase().includes(text.toLowerCase());
    });
  });
}

function sortBy(name:string, key: PropOrGetter<T>, f?:SortFunction<T>){
  const sortIndex = sorting.value?.findIndex(el=>el.name === name);
  if(sortIndex !== undefined  && sortIndex  > -1){
    const el = sorting.value[sortIndex];
    sorting.value?.splice(sortIndex,1)
    if(el?.order === "asc"){
      el.order="desc"
      sorting.value.push(el)
    }
  }else{
    sorting.value?.push({
      name:name,
      order:"asc",
      f:f ?? (
        typeof key === "function"
          ? (a: T, b: T) => key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0
          : (a: T, b: T) => a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0
      )
    })
  }
  sortTable();
}


function getColumnValue(property: PropOrGetter<T>, row: T) {
  return typeof property === 'function' ? property(row) : row[property];
}

function getColumnName(index: number, row: T) {
  const column = props.columns?.[index];
  return column ? column.headerName || Object.keys(row)[index] : Object.keys(row)[index];
}

function getCellClass(cellIndex: number, row: T) {
  if(!props.columns){
    return '';
  }
  const cellClass = props.columns[cellIndex]?.cellClass;
  if (typeof cellClass === 'function') {
    return cellClass(row, Object.keys(row)[cellIndex] as keyof T);
  }
  return cellClass;
}

function sortTable() {
  filteredSortedData.value = [...filteredSortedData.value].sort((a, b) => {
    for(const el of sorting.value){
      const  order = el.order==="asc" ?  el.f(a,b): -1 * el.f(a,b);
      if(order!=0){
        return order;
      }
    }
    return 0;
  });
};

function onRowClick(row: T) {
  // keep existing selected model in sync
  try { selected.value = row; } catch (e) {
    console.error('Failed to set selected row:', e);
  }
  selectedRow.value = row;
  dialogOpen.value = true;
}

function closePopup() {
  dialogOpen.value = false;
  selectedRow.value = null;
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowDown') {
    if (currentIndex.value < filteredSortedData.value.length - 1) {
      currentIndex.value++;
      selected.value = filteredSortedData.value[currentIndex.value];
    }
  } else if (event.key === 'ArrowUp') {
    if (currentIndex.value > 0) {
      currentIndex.value--;
      selected.value = filteredSortedData.value[currentIndex.value];
    }
  }
};
</script>

<style scoped lang="scss">
.sortbar{
  height: 5px!important;
  max-height: 5px!important;
  border-bottom: 3px;
}
#table-scroll {
  max-height: 80vh;
  overflow-y: auto;
  background-color: inherit;
}
.dense-row {
  height: 24px !important;
  min-height: 0 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}
.dense-row > td {
  height: 24px !important;
  min-height: 0 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}
tbody > tr:hover {
  background-color: rgba($primary, 0.1) !important;
}
table {
  background-color: rgba($dark, 0.4);
}

.object-card {
  background: rgba($dark, 0.6) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.04);
  box-shadow: 0 8px 30px rgba(0,0,0,0.6);
  color: $text-color !important;
  overflow: visible;
  animation: popup-in 220ms cubic-bezier(.2,.9,.2,1);
}

.object-card-section {
  padding: 18px 20px;
}

.object-card-body {
  color: $text-color !important;
}

.object-card-actions {
  padding: 8px 12px;
}

@keyframes popup-in {
  from { transform: translateY(-6px) scale(0.98); opacity: 0; }
  to   { transform: translateY(0) scale(1); opacity: 1; }
}

.object-card-actions .object-close-btn,
.object-card-actions .object-close-btn .q-btn__content {
  color: $text-color !important;
}

/* Primary gradient animated button */
.object-card-actions .object-close-btn {
  --btn-padding-vertical: 6px;
  --btn-padding-horizontal: 12px;
  background: linear-gradient(90deg, rgba($primary, 0.20), rgba($primary, 0.06));
  background-size: 200% 100%;
  background-position: 0% 50%;
  border: 1px solid rgba($primary, 0.75) !important;
  color: $text-color !important;
  padding: var(--btn-padding-vertical) var(--btn-padding-horizontal) !important;
  border-radius: 6px !important;
  box-shadow: 0 6px 18px rgba($primary, 0.08);
  transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
  animation: btn-gradient-slide 6s linear infinite;
}

.object-card-actions .object-close-btn:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 10px 28px rgba($primary, 0.14);
  filter: saturate(1.05);
}

@keyframes btn-gradient-slide {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
</style>
