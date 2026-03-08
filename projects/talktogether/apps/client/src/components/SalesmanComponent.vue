<template>
  <ImageCropper v-if="selectedSalesmanImage" :src="selectedSalesmanImage" v-model:show="showCropper" @cropped="onCropped" />
  <q-card-section class="row items-center">
      <q-img class="col-6" id="portrait" v-if="selectedSalesmanImage" :src="selectedSalesmanImage" alt="Salesman Image" />
      <div class="col-6">
          <q-item>
              <q-item-section>
                  <q-item-label>Id</q-item-label>
                  <q-item-label>{{ identification?.[0]?.id_nr }}</q-item-label>
              </q-item-section>
          </q-item>
          <q-item>
              <q-item-section>
                  <q-item-label>Erneuert</q-item-label>
                  <q-item-label>
                      {{ new Date(identification?.[0]?.updatedAt??new Date()).toLocaleDateString() }}
                  </q-item-label>
              </q-item-section>
          </q-item>
          <q-item>
              <q-item-section>
                  <q-item-label>Gültig</q-item-label>
                  <q-item-label>
                      {{ new Date(identification?.[0]?.validTo??new Date()).toLocaleDateString() }}
                  </q-item-label>
              </q-item-section>
          </q-item>
          <q-item></q-item>
      </div>
  </q-card-section>
  <q-separator />
  <q-slide-transition>
    <q-card-section>
      <q-btn
          flat
          dense
          :icon="editOpen ? 'expand_less' : 'expand_more'"
          @click="editOpen = !editOpen"
          class="q-mb-sm"
          label="Bearbeiten"
      />
      <div v-show="editOpen">
        <q-input v-if="salesman" v-model="salesman.id" label="Id" dense  />
        <q-input v-if="salesman" v-model="salesman.last" label="Lastname" dense />
        <q-input v-if="salesman" v-model="salesman.first" label="Firstname" dense />
        <q-input v-if="salesman" v-model="salesman.phone" label="Phone" dense />
        <q-input v-if="salesman" v-model="salesman.message" label="Message" dense />
        <div class="row">
          <div class="col">
            <q-file
              v-model="imgFile"
              label="Bild auswählen"
              accept="image/*"
              dense
              filled
            />
          </div>
          <q-btn icon="crop" @click="showCropper = true" />
        </div>
        <q-separator class="q-my-md" />
        <slot>

        </slot>
      </div>
    </q-card-section>
  </q-slide-transition>
</template>

<script setup lang="ts">
import { baseUrl, datasource, uploads } from 'src/boot/di';
import type { Identification, Salesman } from '@s-core/talktogether';
import {ref, watch } from 'vue';
import ImageCropper from './ImageCropper.vue';

const imgFile = ref<File  | null>(null);
const showCropper = ref(false);
const salesman = defineModel<Salesman>();
const editOpen = ref(false);

const identification = ref<Identification[]>([])
const selectedSalesmanImage = ref<string | null>(null);


watch(salesman, async ()=>{
  if(!salesman.value || !salesman.value.image) {
    selectedSalesmanImage.value = null;
    return;
  }
  selectedSalesmanImage.value = `${baseUrl}/images/${salesman.value.image}`;

    if(salesman.value.id){
        const res =  await datasource.find("Identification",{where:[{ function:"=", params: ["salesman", {value: salesman.value.id}]}]})
        if(res.length > 0){
         identification.value = res as unknown as Identification[];
        }
    }
},{ immediate:true})

watch(imgFile, async (newFile) => {
    if (!newFile) return;
    const formData = new FormData();
    formData.append('file', newFile);
    const imageUrl = await uploads.upload(formData);
    if (imageUrl && salesman.value) {
      salesman.value.image = imageUrl[0]?.filename??'';
      selectedSalesmanImage.value = `${baseUrl}/images/${imageUrl[0]?.filename}`;
    }
});

function onCropped(croppedBlob: Blob) {
    if(!croppedBlob) { showCropper.value = false; return }
    // create a File from the blob so the existing upload flow (watch imgFile) runs
    const file = new File([croppedBlob], `cropped-${Date.now()}.jpg`, { type: 'image/jpeg' })
    // revoke previous preview URL if it was an object URL
    try{
       if(selectedSalesmanImage.value?.startsWith('blob:')) URL.revokeObjectURL(selectedSalesmanImage.value)
    }catch{
      // ignore
    }
    selectedSalesmanImage.value = URL.createObjectURL(file)
    imgFile.value = file
    showCropper.value = false;
}

</script>

<style scoped>
#portrait {
  min-width: 64px;
  aspect-ratio: 7/9;
  max-width: 150px;
}
</style>
