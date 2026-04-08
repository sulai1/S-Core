
<template>
    <SalesmanComponent v-if="salesman" v-model="salesman" :identification="identification" :imgSrc="salesmanImage">
        <template #actions>
            <q-btn color="primary" @click="updateSalesman(salesman)" label="Änderungen speichern" />
            <q-btn color="negative" @click="deleteSalesman(salesman)" label="Verkäufer löschen" />
        </template>
        <slot>
            <q-btn label="Speichern" @click="updateSalesman(salesman)" />
            <q-btn label="Löschen" @click="deleteSalesman(salesman)" />
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

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

const salesman = ref<Salesman>();
const identification = ref<Identification[] | null>(null);
const salesmanImage = ref<string | null>(null);

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

  salesman.value = res[0] as unknown as Salesman;

  if (salesman.value.id) {
    const idRes = await datasource.find('Identification', {
      where: [{ function: '=', params: ['salesman', { value: salesman.value.id }] }],
    });

    if (idRes.length > 0) {
      identification.value = idRes as unknown as Identification[];
    }
  }

  salesmanImage.value = salesman.value.image ? `${baseUrl}/images/${salesman.value.image}` : null;
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
    router.push('/salesmen').catch((e: unknown)=> console.error(e));
  });
};
</script>