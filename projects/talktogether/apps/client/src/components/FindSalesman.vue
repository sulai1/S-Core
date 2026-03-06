<template>
  <div>
    <div class="row" style="width: 100%;">
      <div class="col-6">
        <div style="width: 100%; max-width: 200px; min-width: 120px; margin: 0 auto;" id="salesman-image">
          <q-img
            :src="`${baseUrl}/images/${modelValue?.image}`"
            alt="Bonus Illustration"
            style="object-fit: contain;"
            id="salesman-image"
          />
        </div>
      </div>
      <div class="col-6">
         <q-field readonly label="Ausgewählter Verkäufer" stack-label>
          {{ nickname(modelValue) }}
        </q-field>
        <q-field label="Bemerkung" class="q-mt-md" id="message" stack-label dense style="min-width: 100px;" readonly >
          {{ modelValue?.message }}
        </q-field>
        <q-field label="Gültig bis" class="q-mt-md" id="valid-to" stack-label dense style="min-width: 100px;" readonly >
          {{ new Date(modelValue?.validTo??new Date()).toLocaleDateString() }}
        </q-field>
      </div>
    </div>

    <div class="row">
      <q-input v-model="search" label="Suche Verkäufer (ID oder Name)" />
    </div>
    <q-virtual-scroll
      :items="filteredLimited"
      :virtual-scroll-item-size="48"
      :style="scrollStyle"
      separator
      bordered
    >
      <template v-slot="{ item: s }">
        <q-item :key="s.id" clickable @click="select(s)" :active="modelValue && s.id === modelValue.id">
          <q-item-section>
            <q-item-label>{{nickname(s)}}</q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </q-virtual-scroll>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { baseUrl } from 'src/boot/di';

export type SalesmanView = {
  image:string,
  message:string,
  validTo:string,
  id_nr:number,
  first:string,
  last:string,
  id:number,
};


const props = defineProps<{ salesmen: SalesmanView[]}>();
const emit = defineEmits(['update:modelValue']);
const modelValue = defineModel<SalesmanView>();
const search = ref('');
const $q = useQuasar();

const filtered = computed(() => {
  if (!props.salesmen?.length) return [];
  const str = search.value.trim();
  if (!str) return props.salesmen;
  if (/^\d+$/.test(str)) {
    // Numeric: match by id_nr (exact, then partial)
    return props.salesmen
      .filter(s => String(s.id_nr).includes(str))
      .sort((a, b) => {
        // Exact matches first, then by id_nr descending
        const aExact = String(a.id_nr) === str ? 1 : 0;
        const bExact = String(b.id_nr) === str ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;
        return String(b.id_nr).localeCompare(String(a.id_nr));
      });
  } else {
    // Name: match by first/last (case-insensitive, partial)
    const lower = str.toLowerCase();
    return props.salesmen
      .filter(s =>
        (s.first && s.first.toLowerCase().includes(lower)) ||
        (s.last && s.last.toLowerCase().includes(lower))
      )
      .sort((a, b) => {
        // Prioritize startsWith, then includes, then alphabetically
        const aStarts = (a.first?.toLowerCase().startsWith(lower) || a.last?.toLowerCase().startsWith(lower)) ? 1 : 0;
        const bStarts = (b.first?.toLowerCase().startsWith(lower) || b.last?.toLowerCase().startsWith(lower)) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;
        return a.last.localeCompare(b.last);
      });
  }
});

const filteredLimited = computed(() => filtered.value);

const scrollStyle = computed(() => {
  // Use Quasar's breakpoint plugin for responsive height
  if ($q.screen.lt.md) {
    return 'max-height: 240px;';
  }
  return 'max-height: 480px;';
});

function select(s: SalesmanView) {
  emit('update:modelValue', s);
}

const nickname = (s:SalesmanView|null|undefined) : string => {
  if (!s  ) return '';
  return `${s?.id_nr} - ${s?.first} ${s?.last} ${String(s?.validTo ?? '').slice(0, 10)}`;
};

// Auto-select best match on mount and when salesmen arrive
watch(() => props.salesmen, (salesmen) => {
  if (!modelValue.value && salesmen?.length) {
    emit('update:modelValue', salesmen[0]);
  }
}, { immediate: true });

onMounted(() => {
  if (!modelValue.value && filteredLimited.value.length) {
    emit('update:modelValue', filteredLimited.value[0]);
  }
});
</script>
