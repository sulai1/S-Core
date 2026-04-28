<template>
  <table style="width: 100%;">
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
        <thead  class="thead-sticky text-left">
          <tr :class="{headerRowClass}">
            <th v-for="(column, index) in columns"
              :key="index"
              @click="() => { column.sortable &&  sortBy(column.headerName,column.property,column.sortFunction) }"
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
        </thead>
      </template>
      <template v-slot="{ item: row }">
          <tr :class="getRowClass(row)"
            @click="() => selected=row"
          >
              <td v-for="({cellClass, property, }, index) in columns"
                  :key="index"
                  :class=" typeof cellClass === 'function' ? cellClass(row, row[property]): cellClass"
                  @click="columns[index]?.onClick"
                  >
                  <slot name="cell" :value="typeof property === 'function' ? property(row) : row[property]" :row="row" :column="columns[index]">
                    {{ typeof property === 'function' ? property(row) : row[property]}}
                  </slot>
              </td>
            <slot name="after-row" :row="row"></slot>
          </tr>
      </template>
    </q-virtual-scroll>
  </table>
</template>

<script setup lang="ts" generic="T extends object">
import { onMounted, ref, shallowRef, watch } from 'vue';
import type { ColumnDesc, PropOrGetter, SortFunction } from './table';


export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

const props = defineProps<{
    data:T[],
    columns:ColumnDesc<T,keyof T>[]
    headerRowClass?:string,
    rowClass?:string|((row:T) => string),
    searchable?:boolean
    maxHeight?:string
    sort?: SortConfig[]
}>();

const selected = defineModel<T|null>("selected");
const currentIndex = defineModel<number>("selectedIndex", {default: -1});

const sorting = ref<{name:string, f:SortFunction<T>, order:"desc"|"asc"}[]>([]);
const filteredSortedData = shallowRef<T[]>([]);
const searchString = ref<string>('');

onMounted(() => {
  filteredSortedData.value = [...props.data];
  
  // Initialize sorting from prop if provided
  if (props.sort && props.sort.length > 0) {
    for (const sortConfig of props.sort) {
      const column = props.columns.find(col => col.headerName === sortConfig.column);
      if (column) {
        const sortFn: SortFunction<T> = column.sortFunction ?? (
          typeof column.property === "function"
            ? (a: T, b: T) => {
                const propFn = column.property as (row: T) => string;
                const aVal = propFn(a);
                const bVal = propFn(b);
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
              }
            : (a: T, b: T) => {
                const key = column.property as keyof T;
                return a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
              }
        );
        sorting.value.push({
          name: sortConfig.column,
          order: sortConfig.direction,
          f: sortFn
        });
      }
    }
    sortTable();
  }
});

watch(()=>props.data, (newSalesmen) => {
  filteredSortedData.value = newSalesmen;
  sortTable();
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
    return props.columns.map(col=>typeof col.property === "function" ? col.property(row) : row[col.property])
    .join(" ").toLowerCase().includes(text.toLowerCase());
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

function getRowClass(row:T):string{
  let classes = "";
  if(selected.value === row){
    classes += "selected ";
  }
  if(typeof props.rowClass === 'function'){
    classes += props.rowClass(row);
  }else if(typeof props.rowClass === 'string'){
    classes += props.rowClass;
  }
  return classes.trim();
}
</script>

<style>
.sortbar{
  height: 5px!important;
  max-height: 5px!important;
  border-bottom: 3px;
}
#table-scroll {
  max-height: 80vh;
  overflow-y: auto;
}
</style>
