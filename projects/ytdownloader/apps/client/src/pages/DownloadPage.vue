<template>
  <q-page class="ag-page">
    <q-card class="ag-card">
      <q-card-section>
        <div class="text-overline ag-label">Queue Download</div>
        <div class="text-h5 q-mt-xs">Submit a YouTube video</div>
        <div class="text-body2 text-grey-8 q-mt-sm">
          Paste either a full YouTube URL or a plain 11-char video ID.
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-form @submit.prevent="submit" class="q-gutter-md">
          <q-input
            v-model="videoInput"
            outlined
            label="Video URL or ID"
            :error="Boolean(errorMessage)"
            :error-message="errorMessage"
            placeholder="https://www.youtube.com/watch?v=jNQXAC9IVRw"
          />

          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-4">
              <q-input v-model.number="priority" type="number" min="1" max="10" outlined label="Priority (1-10)" />
            </div>
            <div class="col-12 col-sm-4">
              <q-select
                v-model="outputFormat"
                outlined
                emit-value
                map-options
                label="Output format"
                :options="outputFormatOptions"
              />
            </div>
            <div class="col-12 col-sm-4 flex items-end">
              <q-toggle v-model="embedMetadata" label="Embed metadata tags" />
            </div>
          </div>

          <div class="row">
            <div class="col-12">
              <q-btn color="deep-orange-8" :loading="isSubmitting" type="submit" label="Queue download" class="full-width" />
            </div>
          </div>
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
import { extractVideoId } from 'src/composables/youtube';

const $q = useQuasar();

const videoInput = ref('');
const priority = ref(5);
const outputFormat = ref<'mp3' | 'source'>('mp3');
const embedMetadata = ref(true);
const errorMessage = ref('');
const isSubmitting = ref(false);

const outputFormatOptions = [
  { label: 'MP3 (audio conversion)', value: 'mp3' },
  { label: 'Source format (no conversion)', value: 'source' },
] as const;

const submit = async (): Promise<void> => {
  errorMessage.value = '';
  const videoId = extractVideoId(videoInput.value);

  if (!videoId) {
    errorMessage.value = 'Please provide a valid YouTube URL or video ID.';
    return;
  }

  try {
    isSubmitting.value = true;
    const { data: response } = await apiClient.post('/jobs/download', {
      videoId,
      priority: Math.min(10, Math.max(1, priority.value || 5)),
      outputFormat: outputFormat.value,
      embedMetadata: embedMetadata.value,
    });

    addTrackedJob({
      id: response.jobId,
      label: `Download ${videoId}`,
      kind: 'download',
      createdAt: new Date().toISOString(),
    });

    videoInput.value = '';
    $q.notify({
      color: 'positive',
      message: `Queued download job ${response.jobId}`,
      timeout: 2200,
    });
  } catch (error) {
    console.error(error);
    $q.notify({
      color: 'negative',
      message: 'Failed to queue download job.',
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>
