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
          <q-input
            v-model="channelId"
            outlined
            label="Channel ID or @handle"
            placeholder="UC... or @channel_name"
            hint="Supports both YouTube channel IDs (UC...) and @channel_name handles"
          />
          <q-select
            v-model="interval"
            outlined
            label="Interval"
            :options="intervalOptions"
            emit-value
            map-options
          />
          <q-input
            v-model.number="maxResults"
            outlined
            type="number"
            min="1"
            max="1000"
            label="Max results (optional)"
          />
          <q-input
            v-model.number="minDurationSeconds"
            outlined
            type="number"
            min="1"
            label="Min duration seconds (optional)"
          />
          <q-input
            v-model.number="maxDurationSeconds"
            outlined
            type="number"
            min="1"
            label="Max duration seconds (optional)"
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
const interval = ref<'immediate' | 'daily' | 'weekly'>('immediate');
const maxResults = ref<number | null>(null);
const minDurationSeconds = ref<number | null>(null);
const maxDurationSeconds = ref<number | null>(null);
const isSubmitting = ref(false);

const intervalOptions = [
  { label: 'Immediate', value: 'immediate' as const },
  { label: 'Daily', value: 'daily' as const },
  { label: 'Weekly', value: 'weekly' as const },
];

const submit = async (): Promise<void> => {
  if (!channelId.value.trim()) {
    $q.notify({ color: 'warning', message: 'Channel ID or @handle is required.' });
    return;
  }

  try {
    isSubmitting.value = true;

    const normalizedMinDuration = typeof minDurationSeconds.value === 'number' && minDurationSeconds.value > 0
      ? Math.round(minDurationSeconds.value)
      : undefined;

    const normalizedMaxDuration = typeof maxDurationSeconds.value === 'number' && maxDurationSeconds.value > 0
      ? Math.round(maxDurationSeconds.value)
      : undefined;

    if (
      typeof normalizedMinDuration === 'number'
      && typeof normalizedMaxDuration === 'number'
      && normalizedMinDuration > normalizedMaxDuration
    ) {
      $q.notify({ color: 'warning', message: 'Min duration must be less than or equal to max duration.' });
      return;
    }

    const body = {
      interval: interval.value,
      ...(typeof maxResults.value === 'number' && maxResults.value > 0
        ? { maxResults: Math.min(1000, Math.max(1, Math.round(maxResults.value))) }
        : {}),
      ...(typeof normalizedMinDuration === 'number' ? { minDurationSeconds: normalizedMinDuration } : {}),
      ...(typeof normalizedMaxDuration === 'number' ? { maxDurationSeconds: normalizedMaxDuration } : {}),
    };

    const encodedChannelId = encodeURIComponent(channelId.value.trim());
    const { data: response } = await apiClient.post(`/sync/channels/${encodedChannelId}`, body);

    const jobLabel = response.state === 'scheduled'
      ? `Scheduled sync ${response.channelId} (${interval.value})`
      : `Sync ${response.channelId}`;

    addTrackedJob({
      id: response.jobId,
      label: jobLabel,
      kind: 'sync',
      createdAt: new Date().toISOString(),
    });

    if (response.state === 'scheduled') {
      $q.notify({
        color: 'positive',
        message: `Created ${interval.value} schedule ${response.scheduleId}. Next run: ${response.nextRunAt}`,
      });
      return;
    }

    $q.notify({ color: 'positive', message: `Queued sync job ${response.jobId}` });
  } catch (error) {
    console.error(error);
    $q.notify({ color: 'negative', message: 'Failed to queue sync job.' });
  } finally {
    isSubmitting.value = false;
  }
};
</script>
