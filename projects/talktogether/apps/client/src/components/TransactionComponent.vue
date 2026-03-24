<template>
  <div class="row" style="overflow: hidden;">
    <div class="col-1 flex flex-center q-pa-md">
      <q-btn
        :icon="link ? 'link' : 'link_off'"
        color="secondary"
        flat
        dense
        @click="link = !link"
      />
    </div>
    <div class="col q-pa-md" style="width: 100%;">
      <div class="row">
        <q-input
          v-model.number="quantity"
          data-testid="quantity"
          label="Stück"
          dense
          type="number"
          class="q-mb-md"
        />
        <q-btn
            v-if="!link"
            icon="calculate"
            color="secondary"
            flat
            dense
            @click="recalculateFromTotal()"
          />
      </div>
      <div class="row">
        <q-input
          v-model.number="total"
          label="Total"
          data-testid="total"
          dense
          class="q-mb-sm"
          type="number"
        />
        <q-btn
          v-if="!link"
          icon="calculate"
          color="secondary"
          flat
          dense
          @click="recalculateFromQuantity()"
        />
      </div>
    </div>
    <div class="col q-pa-md">
      <q-field
        label="Berechnet"
        class="q-ml-md q-mb-md"
        stack-label
        dense
        style="min-width: 100px;"
      >
      {{ (bonus   + raw).toFixed(2) }}
          ({{ raw.toFixed(2) }} + {{ bonus.toFixed(2) }})
      </q-field>
      <q-field
        label="Preis pro Stück"
        class="q-ml-md q-mb-md"
        stack-label
        dense
        style="min-width: 100px;"
      >
        <span
          :style="{
             color: price > itemPrice? 'red' : (price > 1.20 ? 'goldenrod' : (price < 1.10 ? 'red' :(price < 1.15 ? 'goldenrod' :'inherit')))
          }"
        >
          {{ price.toFixed(2) }}
        </span>
      </q-field>
    </div>
    <q-btn @click="addTransaction" icon="send" title="Add Transaction" color="primary" class="q-ml-sm" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Item } from '@s-core/talktogether';
import type { Transaction } from '@s-core/talktogether';

const emits = defineEmits<{
    (e: 'commit', transaction: Transaction): void;
}>();

const item = ref<Item | null>(null);
const quantity = ref(0);
const total = ref(0);
const link = ref(true);

const props = defineProps<{ items: Item[]; salesman: number|null}>();

const price = computed(() => quantity.value !=0 ? total.value / quantity.value : itemPrice.value);

const itemPrice = computed(() => item.value?.price ?? 0);

const raw = computed(() => {
  return total.value / itemPrice.value;
});

const bonus = computed(() => {
  return total.value / 10 / itemPrice.value;
});

// Initialize when items/salesmen arrive
watch(() => props.items, (arr) => {
  if (!item.value && arr.length) {
    item.value = arr[0] || null;
    if (item.value) {
      quantity.value = 1;
      resetPrice();
    }
  }
}, { immediate: true });

watch(item, (newItem) => {
  if (!newItem) return;
  resetPrice();
});

function recalculateFromQuantity() {
    total.value = Math.round(itemPrice.value * (quantity.value - Math.floor(quantity.value / 11)) * 100) / 100;
}

function recalculateFromTotal() {
  const withoutBonus = total.value/itemPrice.value
  quantity.value = Math.floor(Math.floor(withoutBonus/10) + withoutBonus);
}

watch(quantity, () => {
  if(link.value) {
    recalculateFromQuantity();
  }
});


watch(total, () => {
  if(link.value){
    recalculateFromTotal();
  }
});

function addTransaction() {
  if( !item.value || (props.salesman !== 0 && !props.salesman) ) {
    alert("Please select an item and a salesman");
    return;
  }
    item.value.quantity -= quantity.value;
    const price = quantity.value > 0 ? item.value.price : item.value.cost;
    emits('commit', {
      id: 0,
      date: new Date().toISOString(),
      item: item.value.id,
      salesman: props.salesman,
      price: price,
      quantity: -quantity.value,
      total: total.value,
    });
}
function resetPrice() {
    quantity.value = price.value ? Math.round((total.value / price.value) * 10) / 10 : 0;
}

</script>

<style scoped lang="scss">
#transaction-compute-mode {
  margin-bottom: 16px;
  q-btn {
    min-width: 80px;
  }
  flex-direction: column;
  width: 100%;
}
#salesman-image {
  img {
    border-radius: 8px;
  }
  min-width: 100px;
  max-width: 300px;
  margin: auto;
}
</style>
