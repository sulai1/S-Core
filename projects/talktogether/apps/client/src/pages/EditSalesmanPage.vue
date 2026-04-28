
<template>
    <SalesmanComponent v-if="salesman" v-model="salesman" :identification="identification" :imgSrc="salesmanImage">
        <slot>
            <div class="row q-gutter-sm q-mt-sm">
              <q-btn color="primary" label="Speichern" @click="updateSalesman(salesman)" />
              <q-btn
                :color="salesman?.locked ? 'positive' : 'warning'"
                :label="salesman?.locked ? 'Entsperren' : 'Sperren'"
                @click="toggleSalesmanLock(salesman)"
              />
              <q-btn color="secondary" label="Ausweis erneuern" @click="renewIdentification(salesman)" />
              <q-btn color="negative" label="Löschen" @click="deleteSalesman(salesman)" />
            </div>
        </slot>
    </SalesmanComponent>
</template>


<script setup lang="ts">
import type { Identification, Salesman } from '@s-core/talktogether';
import { useQuasar } from 'quasar';
import { baseUrl, datasource } from 'src/boot/di';
import SalesmanComponent from 'src/components/SalesmanComponent.vue';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createOrRenewIdentificationForSalesman } from 'src/utils/identification';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

const salesman = ref<Salesman>();
const identification = ref<Identification[] | null>(null);
const salesmanImage = ref<string | null>(null);

async function loadIdentificationHistory(salesmanId: number) {
  const idRes = await datasource.find('Identification', {
    where: [{ function: '=', params: ['salesman', { value: salesmanId }] }],
    orderBy: [['validTo', 'desc']],
  });

  identification.value = idRes ?? [];
}

onMounted(async () => {
  const rawId = route.params.id;
  const salesmanId = Number(Array.isArray(rawId) ? rawId[0] : rawId);

  if (!Number.isInteger(salesmanId) || salesmanId <= 0) {
    alert('Valid salesman id is required');
    router.push('/salesmen').catch((e: unknown) => console.error(e));
    return;
  }

  const res = await datasource.find('Salesman', {
    where: [{ function: '=', params: ['id', { value: salesmanId }] }],
    limit: 1,
  });

  if (!res || res.length === 0) {
    alert('Salesman not found');
    router.push('/salesmen').catch((e: unknown) => console.error(e));
    return;
  }

  salesman.value = res[0];

  if (salesman.value?.id) {
    await loadIdentificationHistory(salesman.value.id);
  }

  salesmanImage.value = salesman.value?.image ? `${baseUrl}/images/${salesman.value.image}` : null;
});

const updateSalesman = async (salesman?: Salesman) => {
  if(typeof salesman?.id === "undefined"){
    alert("id is required");
    return;
  };

  await datasource.update("Salesman", salesman, [{ function:"=",params:["id",{value:salesman.id}]}] );
  $q.notify({ type: 'positive', message: 'Änderungen gespeichert' });
};

const toggleSalesmanLock = async (target?: Salesman) => {
  if (typeof target?.id === 'undefined') {
    alert('id is required');
    return;
  }

  const nextLocked = !target.locked;
  await datasource.update('Salesman', { locked: nextLocked }, [
    { function: '=', params: ['id', { value: target.id }] },
  ]);

  if (salesman.value) {
    salesman.value = { ...salesman.value, locked: nextLocked };
  }

  $q.notify({
    type: 'positive',
    message: nextLocked ? 'Verkäufer gesperrt' : 'Verkäufer entsperrt',
  });
};

const renewIdentification = async (target?: Salesman) => {
  if (typeof target?.id === 'undefined') {
    alert('id is required');
    return;
  }

  await createOrRenewIdentificationForSalesman(target.id);
  await loadIdentificationHistory(target.id);

  $q.notify({
    type: 'positive',
    message: 'Ausweis wurde erneuert',
  });
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
    router.push('/salesmen').catch((e: unknown)=> console.error(e));
  });
};
</script>