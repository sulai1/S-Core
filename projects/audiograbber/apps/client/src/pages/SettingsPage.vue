<template>
  <q-page class="ag-page">
    <q-card class="ag-card">
      <q-card-section>
        <div class="text-overline ag-label">Connection</div>
        <div class="text-h5 q-mt-xs">API endpoint settings</div>
      </q-card-section>
      <q-separator />
      <q-card-section class="q-gutter-md">
        <q-input v-model="url" outlined label="AudioGrabber API base URL" hint="Expected format: http://host:port/api" />
        <div class="text-caption text-grey-7">Current active URL: {{ baseUrl }}</div>
        <div class="row q-gutter-sm">
          <q-btn color="dark" label="Use default" outline @click="useDefault" />
          <q-btn color="primary" :loading="isSaving" label="Save and reconnect" @click="save" />
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { baseUrl, setApiBaseUrl } from 'boot/api';

const $q = useQuasar();
const url = ref(baseUrl);
const isSaving = ref(false);

const useDefault = (): void => {
  url.value = '/api';
};

const save = async (): Promise<void> => {
  if (!url.value.startsWith('http://') && !url.value.startsWith('https://')) {
    $q.notify({ color: 'warning', message: 'URL must start with http:// or https://.' });
    return;
  }

  try {
    isSaving.value = true;
    await setApiBaseUrl(url.value.trim());
    $q.notify({ color: 'positive', message: `Connected to ${url.value}` });
  } catch (error) {
    console.error(error);
    $q.notify({ color: 'negative', message: 'Could not reconnect to API.' });
  } finally {
    isSaving.value = false;
  }
};
</script>
