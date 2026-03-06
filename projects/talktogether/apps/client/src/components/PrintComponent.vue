<template>
    <q-card>
        <q-card-section>
          <div class="text-h6">Ausweise</div>
          <q-item>
            <q-item-section>
              <q-btn icon="picture_as_pdf" title="Erstellen" @click="generateIdentications()" />
            </q-item-section>
            <q-item-section>
              <slot name="actions"></slot>
            </q-item-section>
          </q-item>
        </q-card-section>
        <q-card-section>
            <q-list v-if="salesmen">
                <q-item v-for="salesman in salesmen" :key="salesman.id??0">
                    <q-item-section>
                        <q-item-label>{{ salesman.last + " " +salesman.first   }}</q-item-label>
                    </q-item-section>
                    <q-item-section>
                        <q-btn flat color="primary" icon="delete" @click="salesmen = salesmen.filter((entry)=>entry != salesman)" ></q-btn>
                    </q-item-section>
                </q-item>
            </q-list>
        </q-card-section>
    </q-card>
</template>

<script lang="ts" setup>
import { api  } from 'src/boot/di';
import type { Salesman } from '@s-core/talktogether';
import { watch } from 'vue';
const salesmen = defineModel<Salesman[]>();

watch(salesmen, async ()=>{
    if(!salesmen.value){
        return;
    }
    for(const salesman of salesmen.value){
        if(salesman.image){
            const exists = await checkImageExists(salesman.image);
            if(!exists){
                salesmen.value = salesmen.value.filter((entry)=>entry != salesman);
            }
        }
    }
})

async function checkImageExists(image: string): Promise<boolean> {
    try {
        const response = await api.head('/images/'+image);
        return response.status === 200;
    } catch  {
        alert("Kein Bild gefunden: "+image + "! Ausweis kann nicht erstellt werden, bitte Bild hinzufügen");
        return false;
    }
}

async function generateIdentications() {
    try {
        const response = await api.post('/createIdentification',  salesmen.value , {
            responseType: 'blob', // Important to receive the response as a Blob
            timeout: 111111111
        });

        if (response.status === 200) {
            const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } else {
            alert("Error generating PDF: " + response.statusText);
        }
    } catch (error) {
        alert("Error generating PDF: " + String(error));
    }
}

</script>
