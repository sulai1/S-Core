<template>
  <q-page class="ag-page">
    <q-card class="ag-card">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-overline ag-label">Media Library</div>
          <div class="text-h5 q-mt-xs">All downloads (audio + video)</div>
        </div>
        <q-btn color="dark" outline icon="refresh" label="Refresh" :loading="isLoading" @click="load" />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="row q-col-gutter-sm q-mb-md">
          <div class="col-12 col-md-6">
            <q-input
              v-model="keyword"
              outlined
              clearable
              label="Filter by keyword"
              placeholder="Search by title or file name"
              @keyup.enter="load"
            />
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="mediaType"
              outlined
              emit-value
              map-options
              label="Media type"
              :options="mediaTypeOptions"
              @update:model-value="load"
            />
          </div>
          <div class="col-12 col-md-3 flex items-end">
            <q-btn color="primary" class="full-width" icon="search" label="Apply" :loading="isLoading" @click="load" />
          </div>
        </div>

        <q-table
          flat
          :rows="rows"
          :columns="columns"
          row-key="id"
          :loading="isLoading"
          :pagination="{ rowsPerPage: 12 }"
          @row-click="openMetadata"
          no-data-label="No videos yet"
        >
          <template #body-cell-thumbnailUrl="props">
            <q-td :props="props">
              <q-avatar v-if="props.row.thumbnailUrl" square size="56px">
                <img :src="props.row.thumbnailUrl" alt="thumbnail" />
              </q-avatar>
              <span v-else class="text-grey-6">-</span>
            </q-td>
          </template>
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="statusColor(props.value)">{{ props.value }}</q-badge>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <q-dialog v-model="isMetadataDialogOpen">
      <q-card style="min-width: 340px; max-width: 640px; width: 100%">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-overline ag-label">Download Metadata</div>
            <div class="text-h6">{{ selectedRow?.title ?? 'Metadata' }}</div>
          </div>
          <q-badge v-if="selectedRow" :color="selectedRow.metadata.mediaType === 'audio' ? 'teal' : 'indigo'">
            {{ selectedRow.metadata.mediaType }}
          </q-badge>
        </q-card-section>
        <q-separator />
        <q-card-section v-if="selectedRow" class="q-gutter-sm">
          <div v-if="selectedRow.thumbnailUrl" class="q-mb-sm">
            <q-img :src="selectedRow.thumbnailUrl" alt="thumbnail" style="max-width: 220px" />
          </div>
          <div><strong>ID:</strong> {{ selectedRow.id }}</div>
          <div><strong>Artist:</strong> {{ selectedRow.artist ?? '-' }}</div>
          <div><strong>Album:</strong> {{ selectedRow.album ?? '-' }}</div>
          <div><strong>Year:</strong> {{ selectedRow.year ?? '-' }}</div>
          <div><strong>Estimated BPM:</strong> {{ selectedRow.estimatedBpm ?? '-' }}</div>
          <div><strong>Estimated Key:</strong> {{ selectedRow.estimatedKey ?? '-' }}</div>
          <div><strong>File:</strong> {{ selectedRow.metadata.fileName }}</div>
          <div><strong>Extension:</strong> {{ selectedRow.metadata.extension }}</div>
          <div><strong>Size:</strong> {{ formatBytes(selectedRow.metadata.sizeBytes) }}</div>
          <div><strong>Created:</strong> {{ formatDateTime(selectedRow.metadata.createdAt) }}</div>
          <div><strong>Modified:</strong> {{ formatDateTime(selectedRow.metadata.modifiedAt) }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import { apiClient } from 'boot/api';

type LibraryMediaType = 'all' | 'audio' | 'video';

type VideoRow = {
  id: string;
  title: string;
  status: 'ready' | 'processing' | 'failed';
  artist: string | null;
  album: string | null;
  year: number | null;
  estimatedBpm: number | null;
  estimatedKey: string | null;
  thumbnailUrl?: string;
  metadata: {
    fileName: string;
    extension: string;
    mediaType: 'audio' | 'video';
    sizeBytes: number;
    createdAt: string;
    modifiedAt: string;
  };
};

const $q = useQuasar();
const isLoading = ref(false);
const rows = ref<VideoRow[]>([]);
const keyword = ref('');
const mediaType = ref<LibraryMediaType>('all');
const isMetadataDialogOpen = ref(false);
const selectedRow = ref<VideoRow | null>(null);
const thumbnailObjectUrls = ref<string[]>([]);

const mediaTypeOptions: Array<{ label: string; value: LibraryMediaType }> = [
  { label: 'All', value: 'all' },
  { label: 'Audio', value: 'audio' },
  { label: 'Video', value: 'video' },
];

const columns: QTableColumn<VideoRow>[] = [
  { name: 'thumbnailUrl', label: 'Thumb', field: 'thumbnailUrl', align: 'left' },
  { name: 'id', label: 'ID', field: 'id', align: 'left' },
  { name: 'title', label: 'Title', field: 'title', align: 'left' },
  { name: 'artist', label: 'Artist', field: (row) => row.artist ?? '-', align: 'left' },
  { name: 'album', label: 'Album', field: (row) => row.album ?? '-', align: 'left' },
  { name: 'year', label: 'Year', field: (row) => row.year ?? '-', align: 'left' },
  { name: 'status', label: 'Status', field: 'status', align: 'left' },
];

const statusColor = (status: VideoRow['status']): string => {
  if (status === 'ready') return 'positive';
  if (status === 'processing') return 'warning';
  return 'negative';
};

const openMetadata = (_event: Event, row: VideoRow): void => {
  selectedRow.value = row;
  isMetadataDialogOpen.value = true;
};

const formatDateTime = (iso: string): string => new Date(iso).toLocaleString();

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
};

const revokeThumbnailObjectUrls = (): void => {
  for (const url of thumbnailObjectUrls.value) {
    URL.revokeObjectURL(url);
  }
  thumbnailObjectUrls.value = [];
};

const materializeThumbnailUrls = async (items: VideoRow[]): Promise<VideoRow[]> => {
  const resolved = await Promise.all(items.map(async (item) => {
    if (!item.thumbnailUrl) {
      return item;
    }

    try {
      const { data } = await apiClient.get<Blob>(item.thumbnailUrl, { responseType: 'blob' });
      const objectUrl = URL.createObjectURL(data);
      thumbnailObjectUrls.value.push(objectUrl);
      return {
        ...item,
        thumbnailUrl: objectUrl,
      };
    } catch {
      return {
        ...item,
        thumbnailUrl: undefined,
      };
    }
  }));

  return resolved;
};

const load = async (): Promise<void> => {
  try {
    isLoading.value = true;
    revokeThumbnailObjectUrls();
    const trimmedKeyword = keyword.value.trim();
    const { data: response } = await apiClient.get('/library/videos', {
      params: {
        limit: 100,
        keyword: trimmedKeyword.length > 0 ? trimmedKeyword : undefined,
        mediaType: mediaType.value,
      }
    });
    rows.value = await materializeThumbnailUrls(response.items as VideoRow[]);
  } catch (error) {
    console.error(error);
    $q.notify({ color: 'negative', message: 'Failed to load library.' });
  } finally {
    isLoading.value = false;
  }
};

onMounted(load);
onBeforeUnmount(revokeThumbnailObjectUrls);
</script>
