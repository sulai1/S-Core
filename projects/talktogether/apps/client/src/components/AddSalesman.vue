<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <q-card class="q-dialog-plugin-card">
          <q-card-section>
            <q-input v-model="salesman.first" label="Vorname" />
            <q-input v-model="salesman.last" label="Nachname" />
            <q-input v-model="salesman.phone" label="Tel" />
            <q-file
              accept="image/*"
              :model-value="[]"
              @update:model-value="onFileChange"
              label="Bild"
              hide-upload-btn
            />
            <div v-if="previewSrc" style="margin-top:8px; display:flex; gap:8px; align-items:center;">
              <img :src="previewSrc" alt="preview" style="width:96px; height:96px; object-fit:cover; border-radius:6px;" />
              <div style="display:flex; flex-direction:column; gap:6px;">
                <q-btn size="sm" label="Ändern / Zuschneiden" color="primary" @click="openCropper" />
                <q-btn size="sm" label="Entfernen" color="negative" flat @click="removeImage" />
              </div>
            </div>
            <ImageCropper :src="cropSrc" v-model:show="cropperVisible" @cropped="onCropped" />
          </q-card-section>
        </q-card>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn color="primary" label="OK" @click="onOKClick" />
        <q-btn color="primary" label="Cancel" @click="onDialogCancel" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent, useQuasar } from 'quasar';
import type { InferCreationSchema } from '@s-core/client';
import type { salesman as sm } from '@s-core/talktogether';
import { ref } from 'vue';
import ImageCropper from './ImageCropper.vue';
import { uploadImage } from './upload';
import { datasource } from 'src/boot/di';

const salesman = ref<InferCreationSchema<typeof  sm>>({
  first: '',
  last: '',
  phone: '',
  image: '',
});

const image = ref<File | null>(null);
const previewSrc = ref<string | null>(null);
const cropSrc = ref<string | null>(null);
const cropperVisible = ref(false);

defineEmits([
  ...useDialogPluginComponent.emits
])
const $q = useQuasar();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
async function createSalesman () {
    if(!salesman.value.first || !salesman.value.last){
        throw new Error("Please fill all fields")
    }
    if(!image.value){
        throw new Error("Please select an image")
    }
    salesman.value.image = image.value.name;
    const imgName = await uploadImage(image.value)
    if(!imgName){
        throw new Error("Error uploading image")
    }
    salesman.value.image = imgName;
    const res = await datasource.insert("Salesman",[salesman.value])
    if(!res){
        throw new Error("Creating salesman failed: " + JSON.stringify(res))
    }
}

function onFileChange (input: unknown) {
  let f: File | undefined
  if(!input) return
  if(Array.isArray(input)) f = input[0]
  else if(input instanceof FileList) f = input.item(0) ?? undefined
  else if(input instanceof File) f = input
  if(!f) return;
  image.value = f;
  previewSrc.value = URL.createObjectURL(image.value);
  cropSrc.value = previewSrc.value;
  // open cropper right away
  cropperVisible.value = true;
}

function openCropper (){
  if(!previewSrc.value) return;
  cropSrc.value = previewSrc.value;
  cropperVisible.value = true;
}

function removeImage(){
  image.value = null;
  if(previewSrc.value){
    URL.revokeObjectURL(previewSrc.value);
  }
  previewSrc.value = null;
  cropSrc.value = null;
}

function onCropped(blob: Blob){
  // convert blob to File so uploadImage receives a File
  const file = new File([blob], image.value?.name ?? `cropped-${Date.now()}.jpg`, { type: 'image/jpeg' })
  image.value = file;
  if(previewSrc.value){ URL.revokeObjectURL(previewSrc.value) }
  previewSrc.value = URL.createObjectURL(file);
}

async function onOKClick () {
    const existing =  await datasource.find("Salesman",{where:[
        { function:"=", params: ["first", {value:salesman.value.first}] },
        { function:"=", params: ["last", {value:salesman.value.last}] },
    ]})
    if(existing.length > 0){
        $q.dialog({
            title: 'Duplikat',
            message: 'Verkäufer existiert bereits, trotzdem hinzufügen?',
            ok: 'OK',
            cancel: 'Abbrechen',
            persistent: true
        }).onOk(() => {
            createSalesman()
            .then(()=>{
                onDialogOK(salesman.value)
            })
            .catch((e)=>{
                onDialogCancel()
                throw e
            })
      })
    }else{
        createSalesman()
        .then(()=>{
            onDialogOK(salesman.value)
        })
        .catch((e)=>{
            onDialogCancel()
            throw e
        })
    }
}
</script>
