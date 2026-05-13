<template>
  <q-page class="ag-page">
    <q-card class="ag-card">
      <q-card-section>
        <div class="text-overline ag-label">Channel Sync</div>
        <div class="text-h5 q-mt-xs">Trigger channel ingestion</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-form @submit.prevent="submit" class="q-gutter-md">
          <q-input v-model="channelId" outlined label="Channel ID" placeholder="UC..." />
          <q-input
            v-model.number="maxResults"
            outlined
            type="number"
            min="1"
            max="1000"
            label="Max results (optional)"
          />
          <q-btn color="teal-8" :loading="isSubmitting" type="submit" label="Queue sync" />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { apiClient } from 'boot/api';
import { addTrackedJob } from 'src/composables/jobTracker';

const $q = useQuasar();

const channelId = ref('');
const maxResults = ref<number | null>(null);
const isSubmitting = ref(false);

const submit = async (): Promise<void> => {
  if (!channelId.value.trim()) {
    $q.notify({ color: 'warning', message: 'Channel ID is required.' });
    return;
  }

  try {
    isSubmitting.value = true;
    const body = maxResults.value
      ? { maxResults: Math.min(1000, Math.max(1, maxResults.value)) }
      : {};

    const encodedChannelId = encodeURIComponent(channelId.value.trim());
    const { data: response } = await apiClient.post(`/sync/channels/${encodedChannelId}`, body);

    addTrackedJob({
      id: response.jobId,
      label: `Sync ${response.channelId}`,
      kind: 'sync',
      createdAt: new Date().toISOString(),
    });

    $q.notify({ color: 'positive', message: `Queued sync job ${response.jobId}` });
  } catch (error) {
    console.error(error);
    $q.notify({ color: 'negative', message: 'Failed to queue sync job.' });
  } finally {
    isSubmitting.value = false;
  }
};
</script>
