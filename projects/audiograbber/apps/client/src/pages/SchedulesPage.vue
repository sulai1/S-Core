<template>
  <q-page class="ag-page">
    <q-card class="ag-card">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-overline ag-label">Schedules</div>
          <div class="text-h5 q-mt-xs">Sync schedule runs</div>
        </div>
        <q-btn color="dark" outline icon="refresh" :loading="isLoading" @click="loadSchedules" />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-list v-if="rows.length > 0" separator>
          <q-item v-for="row in rows" :key="row.scheduleId" class="q-py-md">
            <q-item-section>
              <q-item-label class="text-subtitle1">{{ row.channelId }}</q-item-label>
              <q-item-label caption>
                {{ row.interval }} • next {{ formatDate(row.nextRunAt) }}
              </q-item-label>
              <q-item-label caption v-if="row.lastRunAt">
                last run {{ formatDate(row.lastRunAt) }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-badge :color="row.enabled ? 'positive' : 'grey-7'">
                {{ row.enabled ? 'enabled' : 'disabled' }}
              </q-badge>
            </q-item-section>

            <q-item-section side>
              <q-btn
                color="teal-8"
                icon="play_arrow"
                label="Run now"
                :loading="runningScheduleId === row.scheduleId"
                @click="runNow(row)"
              />
            </q-item-section>
          </q-item>

          <q-item v-for="row in rows" :key="`${row.scheduleId}-runs`" class="q-pt-none">
            <q-item-section>
              <q-expansion-item
                switch-toggle-side
                dense
                dense-toggle
                label="Recent runs"
                expand-separator
                default-opened
              >
                <q-card flat bordered class="q-mt-sm">
                  <q-table
                    flat
                    dense
                    :rows="row.recentRuns"
                    :columns="runColumns"
                    row-key="jobId"
                    hide-pagination
                    :pagination="{ rowsPerPage: 10 }"
                  >
                    <template #body-cell-state="props">
                      <q-td :props="props">
                        <q-badge :color="stateColor(props.row.state)">{{ props.row.state }}</q-badge>
                      </q-td>
                    </template>
                    <template #body-cell-createdAt="props">
                      <q-td :props="props">{{ formatDate(props.row.createdAt) }}</q-td>
                    </template>
                    <template #body-cell-finishedAt="props">
                      <q-td :props="props">{{ formatDate(props.row.finishedAt) }}</q-td>
                    </template>
                    <template #body-cell-videosDownloaded="props">
                      <q-td :props="props">{{ props.row.videosDownloaded ?? '-' }}</q-td>
                    </template>
                    <template #body-cell-error="props">
                      <q-td :props="props" class="text-negative">
                        {{ props.row.error ?? '-' }}
                      </q-td>
                    </template>
                    <template #no-data>
                      <div class="q-pa-md text-grey-7">No runs yet for this schedule.</div>
                    </template>
                  </q-table>
                </q-card>
              </q-expansion-item>
            </q-item-section>
          </q-item>
        </q-list>
        <div v-else class="text-body2 text-grey-7">No schedules yet. Create one from the Sync page using daily or weekly interval.</div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { apiClient } from 'boot/api';
import { addTrackedJob } from 'src/composables/jobTracker';

type RunState = 'queued' | 'running' | 'success' | 'failed';

type ScheduleRun = {
  jobId: string;
  state: RunState;
  channelId: string;
  createdAt: string;
  finishedAt: string;
  videosDownloaded: number | null;
  error?: string;
};

type ScheduleRow = {
  scheduleId: string;
  channelId: string;
  interval: 'daily' | 'weekly';
  enabled: boolean;
  maxResults: number | null;
  minDurationSeconds: number | null;
  maxDurationSeconds: number | null;
  lastRunAt: string | null;
  nextRunAt: string;
  recentRuns: ScheduleRun[];
};

const $q = useQuasar();

const isLoading = ref(false);
const runningScheduleId = ref<string | null>(null);
const rows = ref<ScheduleRow[]>([]);

const runColumns = [
  { name: 'state', label: 'State', field: 'state', align: 'left' as const },
  { name: 'channelId', label: 'Channel', field: 'channelId', align: 'left' as const },
  { name: 'videosDownloaded', label: 'Videos', field: 'videosDownloaded', align: 'left' as const },
  { name: 'createdAt', label: 'Started', field: 'createdAt', align: 'left' as const },
  { name: 'finishedAt', label: 'Finished', field: 'finishedAt', align: 'left' as const },
  { name: 'error', label: 'Error', field: 'error', align: 'left' as const },
];

const stateColor = (state: RunState): string => {
  if (state === 'success') return 'positive';
  if (state === 'failed') return 'negative';
  if (state === 'running') return 'warning';
  return 'grey-7';
};

const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

const loadSchedules = async (): Promise<void> => {
  isLoading.value = true;
  try {
    const { data } = await apiClient.get<{ items: ScheduleRow[] }>('/sync/schedules');
    rows.value = (data.items ?? []).map((item) => ({
      ...item,
      recentRuns: Array.isArray(item.recentRuns) ? item.recentRuns : [],
    }));
  } catch (error) {
    console.error(error);
    $q.notify({ color: 'negative', message: 'Failed to load schedules.' });
  } finally {
    isLoading.value = false;
  }
};

const runNow = async (row: ScheduleRow): Promise<void> => {
  runningScheduleId.value = row.scheduleId;
  try {
    const encodedId = encodeURIComponent(row.scheduleId);
    const { data } = await apiClient.post<{ scheduleId: string; jobId: string; state: 'queued' }>(`/sync/schedules/${encodedId}/run`);
    addTrackedJob({
      id: data.jobId,
      label: `Schedule run ${row.channelId}`,
      kind: 'sync',
      createdAt: new Date().toISOString(),
    });
    $q.notify({ color: 'positive', message: `Queued schedule run ${data.jobId}` });
    await loadSchedules();
  } catch (error) {
    console.error(error);
    $q.notify({ color: 'negative', message: 'Failed to run schedule now.' });
  } finally {
    runningScheduleId.value = null;
  }
};

onMounted(async () => {
  await loadSchedules();
});
</script>
