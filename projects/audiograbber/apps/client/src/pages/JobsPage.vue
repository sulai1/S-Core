<template>
  <q-page class="ag-page">
    <q-card class="ag-card">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-overline ag-label">Job Monitor</div>
          <div class="text-h5 q-mt-xs">Tracked jobs</div>
        </div>
        <div class="row q-gutter-sm">
          <q-btn color="dark" outline icon="refresh" :loading="isRefreshing" @click="refreshJobs" />
          <q-btn color="negative" flat label="Clear finished" @click="clearFinished" />
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-list separator v-if="rows.length > 0">
          <q-item v-for="row in rows" :key="row.id">
            <q-item-section>
              <q-item-label>{{ row.label }}</q-item-label>
              <q-item-label caption>{{ row.id }} • {{ new Date(row.createdAt).toLocaleString() }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge
                :color="stateColor(row.state)"
                :class="{ 'cursor-pointer': row.state === 'failed' }"
                @click.stop="onBadgeClick(row)"
              >
                {{ row.state }}
              </q-badge>
            </q-item-section>
            <q-item-section side style="min-width: 140px">
              <q-linear-progress :value="(row.progress ?? 0) / 100" rounded size="10px" color="teal" track-color="grey-3" />
              <div class="text-caption text-grey-7 text-right q-mt-xs">{{ Math.max(0, Math.min(100, Math.round(row.progress ?? 0))) }}%</div>
            </q-item-section>
            <q-item-section side>
              <q-btn flat dense icon="delete" @click="remove(row.id)" />
            </q-item-section>
          </q-item>
        </q-list>
        <div v-else class="text-body2 text-grey-7">No tracked jobs yet. Queue a download or sync first.</div>
      </q-card-section>
    </q-card>

    <q-dialog v-model="isErrorDialogOpen">
      <q-card style="min-width: 340px; max-width: 700px; width: 100%">
        <q-card-section>
          <div class="text-overline ag-label">Job Failure</div>
          <div class="text-h6 q-mt-xs">{{ selectedFailedJob?.label ?? 'Failed job' }}</div>
          <div class="text-caption text-grey-7 q-mt-xs" v-if="selectedFailedJob">
            {{ selectedFailedJob.id }}
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="text-subtitle2 q-mb-sm">Error message</div>
          <q-banner rounded class="bg-red-1 text-negative">
            {{ selectedFailedJob?.error ?? 'No error details were provided.' }}
          </q-banner>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat color="primary" label="Close" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { apiClient } from 'boot/api';
import { getTrackedJobs, removeTrackedJob, type TrackedJob } from 'src/composables/jobTracker';

type JobState = 'queued' | 'running' | 'success' | 'failed';

type JobRow = TrackedJob & {
  state: JobState;
  progress?: number;
  error?: string;
};

const rows = ref<JobRow[]>([]);
const isRefreshing = ref(false);
const isErrorDialogOpen = ref(false);
const selectedFailedJob = ref<JobRow | null>(null);
let pollHandle: ReturnType<typeof setInterval> | undefined;

const stateColor = (state: JobState): string => {
  if (state === 'success') return 'positive';
  if (state === 'failed') return 'negative';
  if (state === 'running') return 'warning';
  return 'grey-7';
};

const refreshJobs = async (): Promise<void> => {
  const tracked = getTrackedJobs();
  isRefreshing.value = true;
  try {
    const next = await Promise.all(
      tracked.map(async (job): Promise<JobRow> => {
        try {
          const encodedJobId = encodeURIComponent(job.id);
          const { data } = await apiClient.get(`/jobs/${encodedJobId}`);
          return {
            ...job,
            state: data.state,
            progress: data.progress,
            error: data.error,
          };
        } catch {
          return {
            ...job,
            state: 'failed',
            error: 'Job not found or API unavailable',
          };
        }
      }),
    );

    rows.value = next;
  } finally {
    isRefreshing.value = false;
  }
};

const remove = (id: string): void => {
  removeTrackedJob(id);
  rows.value = rows.value.filter((row) => row.id !== id);
};

const onBadgeClick = (row: JobRow): void => {
  if (row.state !== 'failed') {
    return;
  }

  selectedFailedJob.value = row;
  isErrorDialogOpen.value = true;
};

const clearFinished = (): void => {
  for (const row of rows.value) {
    if (row.state === 'success' || row.state === 'failed') {
      removeTrackedJob(row.id);
    }
  }
  rows.value = rows.value.filter((row) => row.state !== 'success' && row.state !== 'failed');
};

onMounted(async () => {
  await refreshJobs();
  pollHandle = setInterval(() => {
    void refreshJobs();
  }, 3000);
});

onUnmounted(() => {
  if (pollHandle) {
    clearInterval(pollHandle);
  }
});
</script>
