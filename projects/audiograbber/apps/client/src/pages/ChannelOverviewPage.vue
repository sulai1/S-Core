<template>
  <q-page class="ag-page">
    <q-card class="ag-card q-mb-md">
      <q-card-section>
        <div class="text-overline ag-label">Channel Overview</div>
        <div class="text-h5 q-mt-xs">Browse all videos from a channel</div>
        <div class="text-body2 text-grey-8 q-mt-sm">
          Enter either a channel handle (for example <strong>@mychannel</strong>) or a channel ID (<strong>UC...</strong>).
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-form class="row q-col-gutter-sm" @submit.prevent="loadOverview">
          <div class="col-12 col-md-8">
            <q-input
              v-model="channelInput"
              outlined
              label="Channel handle or ID"
              placeholder="@channel_name or UCxxxxxxxx"
              :disable="isLoading"
            />
          </div>
          <div class="col-12 col-md-2">
            <q-input
              v-model.number="maxResults"
              outlined
              type="number"
              min="1"
              max="200"
              label="Max videos"
              :disable="isLoading"
            />
          </div>
          <div class="col-12 col-md-2 flex items-end">
            <q-btn
              color="primary"
              class="full-width"
              icon="search"
              label="Load"
              :loading="isLoading"
              type="submit"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <q-card v-if="overview" class="ag-card">
      <q-card-section>
        <div class="text-overline ag-label">Channel</div>
        <div class="text-h6 q-mt-xs">{{ overview.channel.title }}</div>
        <div class="text-caption text-grey-7 q-mt-xs">{{ overview.channel.id }}</div>
        <div class="text-body2 q-mt-sm" v-if="overview.channel.description">
          {{ overview.channel.description }}
        </div>
        <div class="q-mt-sm text-caption text-grey-7">
          Videos returned: {{ overview.videos.length }}
          <span v-if="typeof overview.channel.videoCount === 'number'"> • Channel video count: {{ overview.channel.videoCount }}</span>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="row q-col-gutter-sm q-mb-md">
          <div class="col-12 col-md-3">
            <q-input
              v-model.number="minLengthMinutes"
              outlined
              type="number"
              min="0"
              step="0.1"
              label="Min length (minutes)"
              :disable="isLoading || isDownloading"
            />
          </div>
          <div class="col-12 col-md-3">
            <q-input
              v-model.number="maxLengthMinutes"
              outlined
              type="number"
              min="0"
              step="0.1"
              label="Max length (minutes)"
              :disable="isLoading || isDownloading"
            />
          </div>
          <div class="col-12 col-md-3 flex items-end">
            <div class="text-caption text-grey-7">
              Filtered: {{ filteredVideos.length }} / {{ overview.videos.length }}
              <span v-if="downloadableFilteredVideos.length !== filteredVideos.length">
                • {{ downloadableFilteredVideos.length }} downloadable
              </span>
            </div>
          </div>
          <div class="col-12 col-md-3 flex items-end">
            <q-btn
              color="deep-orange-8"
              icon="download"
              class="full-width"
              label="Download all filtered"
              :loading="isDownloading"
              :disable="downloadableFilteredVideos.length === 0 || isDownloading"
              @click="downloadFilteredVideos"
            />
          </div>
        </div>

        <q-table
          flat
          :rows="filteredVideos"
          :columns="columns"
          row-key="videoId"
          :pagination="{ rowsPerPage: 20 }"
        >
          <template #body="props">
            <q-tr :props="props" @click="showVideoMetadata(props.row)" class="cursor-pointer hover:bg-grey-2">
              <q-td key="thumbnailUrl" :props="props">
                <q-avatar square size="64px" v-if="props.row.thumbnailUrl">
                  <img :src="props.row.thumbnailUrl" alt="thumbnail" />
                </q-avatar>
              </q-td>
              <q-td key="title" :props="props">
                <div class="text-weight-medium">{{ props.row.title }}</div>
              </q-td>
              <q-td key="videoId" :props="props">
                <a :href="`https://www.youtube.com/watch?v=${props.row.videoId}`" target="_blank" rel="noopener noreferrer" @click.stop>
                  {{ props.row.videoId }}
                </a>
              </q-td>
              <q-td key="duration" :props="props">
                {{ formatDuration(props.row.duration) }}
              </q-td>
              <q-td key="viewCount" :props="props">
                {{ formatNumber(props.row.viewCount) }}
              </q-td>
              <q-td key="publishedAt" :props="props">{{ formatDate(props.row.publishedAt) }}</q-td>
              <q-td key="download" :props="props" class="text-right">
                <q-btn
                  v-if="!isDownloaded(props.row.videoId)"
                  flat
                  dense
                  icon="download"
                  label="Download"
                  color="primary"
                  :loading="isDownloading"
                  @click.stop="downloadVideo(props.row)"
                />
                <q-badge v-else color="positive">Downloaded</q-badge>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <q-dialog v-model="showMetadataDialog" v-if="selectedVideo">
      <q-card class="ag-card" style="min-width: 500px">
        <q-card-section class="row items-start">
          <div class="col-3 q-pr-md">
            <q-avatar square size="60px" v-if="selectedVideo.thumbnailUrl">
              <img :src="selectedVideo.thumbnailUrl" alt="thumbnail" />
            </q-avatar>
          </div>
          <div class="col-9">
            <div class="text-h6 q-mb-sm">{{ selectedVideo.title }}</div>
            <div class="text-caption text-grey-7 q-mb-md">
              <a :href="`https://www.youtube.com/watch?v=${selectedVideo.videoId}`" target="_blank" rel="noopener noreferrer">
                {{ selectedVideo.videoId }}
              </a>
            </div>
            <div class="q-mb-sm">
              <div class="text-caption text-grey-6">Duration</div>
              <div class="text-body2">{{ formatDuration(selectedVideo.duration) }}</div>
            </div>
            <div class="q-mb-sm">
              <div class="text-caption text-grey-6">Published</div>
              <div class="text-body2">{{ formatDate(selectedVideo.publishedAt) }}</div>
            </div>
            <div class="q-mb-sm">
              <div class="text-caption text-grey-6">Views</div>
              <div class="text-body2">{{ formatNumber(selectedVideo.viewCount) }}</div>
            </div>
            <div v-if="selectedVideo.likeCount" class="q-mb-sm">
              <div class="text-caption text-grey-6">Likes</div>
              <div class="text-body2">{{ formatNumber(selectedVideo.likeCount) }}</div>
            </div>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section v-if="selectedVideo.artist || selectedVideo.songTitle || selectedVideo.album">
          <div class="text-caption text-grey-6 q-mb-xs">Music Metadata</div>
          <div v-if="selectedVideo.artist" class="q-mb-xs">
            <div class="text-caption text-grey-6">Artist</div>
            <div class="text-body2 text-weight-medium">{{ selectedVideo.artist }}</div>
          </div>
          <div v-if="selectedVideo.songTitle" class="q-mb-xs">
            <div class="text-caption text-grey-6">Song Title</div>
            <div class="text-body2 text-weight-medium">{{ selectedVideo.songTitle }}</div>
          </div>
          <div v-if="selectedVideo.album">
            <div class="text-caption text-grey-6">Album</div>
            <div class="text-body2 text-weight-medium">{{ selectedVideo.album }}</div>
          </div>
        </q-card-section>
        <q-separator v-if="selectedVideo.artist || selectedVideo.songTitle || selectedVideo.album" />
        <q-card-section v-if="selectedVideo.description">
          <div class="text-caption text-grey-6 q-mb-xs">Description</div>
          <div class="text-body2 text-pre-wrap">{{ selectedVideo.description.substring(0, 300) }}{{ selectedVideo.description.length > 300 ? '...' : '' }}</div>
        </q-card-section>
        <q-separator v-if="selectedVideo.description && selectedVideo.tags?.length" />
        <q-card-section v-if="selectedVideo.tags?.length">
          <div class="text-caption text-grey-6 q-mb-xs">Tags</div>
          <div class="q-gutter-xs">
            <q-chip v-for="tag in selectedVideo.tags" :key="tag" size="sm" color="primary" text-color="white">
              {{ tag }}
            </q-chip>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" @click="showMetadataDialog = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import { apiClient } from 'boot/api';
import { addTrackedJob } from 'src/composables/jobTracker';

type Video = {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnailUrl?: string;
  duration?: string;
  viewCount?: number;
  likeCount?: number;
  description?: string;
  tags?: string[];
  artist?: string;
  songTitle?: string;
  album?: string;
};

type ChannelOverview = {
  channel: {
    id: string;
    title: string;
    description?: string;
    customUrl?: string;
    videoCount?: number;
  };
  videos: Video[];
};

type PersistedOverviewState = {
  version: 1;
  channelInput: string;
  maxResults: number;
  minLengthMinutes: number | null;
  maxLengthMinutes: number | null;
  overview: ChannelOverview | null;
};

const OVERVIEW_STATE_KEY = 'audiograbber.channelOverview.state.v1';

const $q = useQuasar();
const channelInput = ref('');
const maxResults = ref(100);
const isLoading = ref(false);
const isDownloading = ref(false);
const overview = ref<ChannelOverview | null>(null);
const selectedVideo = ref<Video | null>(null);
const showMetadataDialog = ref(false);
const minLengthMinutes = ref<number | null>(null);
const maxLengthMinutes = ref<number | null>(null);
const downloadedVideoIds = ref<string[]>([]);

const columns: QTableColumn<Video>[] = [
  { name: 'thumbnailUrl', label: 'Thumb', field: 'thumbnailUrl', align: 'left', style: 'width: 80px' },
  { name: 'title', label: 'Title', field: 'title', align: 'left', sortable: true },
  { name: 'videoId', label: 'Video ID', field: 'videoId', align: 'left' },
  { name: 'duration', label: 'Duration', field: 'duration', align: 'left' },
  { name: 'viewCount', label: 'Views', field: 'viewCount', align: 'left', sortable: true },
  { name: 'publishedAt', label: 'Published', field: 'publishedAt', align: 'left', sortable: true },
  { name: 'download', label: 'Download', field: 'videoId', align: 'right' },
];

const formatDate = (iso: string): string => new Date(iso).toLocaleString();
const formatNumber = (num?: number): string => num ? new Intl.NumberFormat().format(num) : '-';
const durationToSeconds = (iso?: string): number | undefined => {
  if (!iso) return undefined;

  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return undefined;

  const [, hours, minutes, seconds] = match;
  const h = hours ? Number.parseInt(hours, 10) : 0;
  const m = minutes ? Number.parseInt(minutes, 10) : 0;
  const s = seconds ? Number.parseInt(seconds, 10) : 0;
  return (h * 3600) + (m * 60) + s;
};

const formatDuration = (iso?: string): string => {
  if (!iso) return '-';
  // Parse ISO 8601 duration PT5M30S -> 5:30
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return iso;
  const [, hours, minutes, seconds] = match;
  const h = hours ? parseInt(hours) : 0;
  const m = minutes ? parseInt(minutes) : 0;
  const s = seconds ? parseInt(seconds) : 0;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const downloadedIdSet = computed(() => new Set(downloadedVideoIds.value));

const isDownloaded = (videoId: string): boolean => downloadedIdSet.value.has(videoId);

const filteredVideos = computed(() => {
  const videos = overview.value?.videos ?? [];
  const minSeconds = typeof minLengthMinutes.value === 'number' && Number.isFinite(minLengthMinutes.value)
    ? minLengthMinutes.value * 60
    : undefined;
  const maxSeconds = typeof maxLengthMinutes.value === 'number' && Number.isFinite(maxLengthMinutes.value)
    ? maxLengthMinutes.value * 60
    : undefined;

  return videos.filter((video) => {
    const durationSeconds = durationToSeconds(video.duration);

    if (typeof minSeconds === 'number' && (durationSeconds === undefined || durationSeconds < minSeconds)) {
      return false;
    }

    if (typeof maxSeconds === 'number' && (durationSeconds === undefined || durationSeconds > maxSeconds)) {
      return false;
    }

    return true;
  });
});

const downloadableFilteredVideos = computed(() => filteredVideos.value.filter((video) => !isDownloaded(video.videoId)));

const saveOverviewState = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const payload: PersistedOverviewState = {
    version: 1,
    channelInput: channelInput.value,
    maxResults: maxResults.value,
    minLengthMinutes: minLengthMinutes.value,
    maxLengthMinutes: maxLengthMinutes.value,
    overview: overview.value,
  };

  window.localStorage.setItem(OVERVIEW_STATE_KEY, JSON.stringify(payload));
};

const restoreOverviewState = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const raw = window.localStorage.getItem(OVERVIEW_STATE_KEY);
  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedOverviewState>;
    if (parsed.version !== 1) {
      return;
    }

    channelInput.value = typeof parsed.channelInput === 'string' ? parsed.channelInput : '';
    maxResults.value = typeof parsed.maxResults === 'number' ? parsed.maxResults : 100;
    minLengthMinutes.value = typeof parsed.minLengthMinutes === 'number' ? parsed.minLengthMinutes : null;
    maxLengthMinutes.value = typeof parsed.maxLengthMinutes === 'number' ? parsed.maxLengthMinutes : null;
    overview.value = parsed.overview ?? null;
  } catch (error) {
    console.error('Failed to restore overview state', error);
  }
};

const loadLibraryVideos = async (): Promise<void> => {
  try {
    const { data: response } = await apiClient.get('/library/videos');
    downloadedVideoIds.value = response.items.map((item) => item.id);
  } catch (error) {
    console.error(error);
  }
};

const showVideoMetadata = (video: Video): void => {
  selectedVideo.value = video;
  showMetadataDialog.value = true;
};

const queueDownload = async (video: Video): Promise<'queued' | 'skipped'> => {
  if (isDownloaded(video.videoId)) {
    return 'skipped';
  }

  const { data: response } = await apiClient.post('/jobs/download', {
    videoId: video.videoId,
    outputFormat: 'mp3',
    embedMetadata: true,
    songTitle: video.songTitle ?? video.title,
    artist: video.artist,
    album: video.album,
  });

  addTrackedJob({
    id: response.jobId,
    label: `Download ${video.songTitle ?? video.title}`,
    kind: 'download',
    createdAt: new Date().toISOString(),
  });

  return 'queued';
};

const downloadVideo = async (video: Video): Promise<void> => {
  try {
    isDownloading.value = true;
    const result = await queueDownload(video);
    if (result === 'skipped') {
      $q.notify({ color: 'info', message: `${video.title} is already downloaded.` });
      return;
    }

    $q.notify({ color: 'positive', message: `Queued download for ${video.songTitle ?? video.title}.` });
    await loadLibraryVideos();
  } catch (error) {
    console.error(error);
    $q.notify({ color: 'negative', message: `Failed to queue ${video.title}.` });
  } finally {
    isDownloading.value = false;
  }
};

const downloadFilteredVideos = async (): Promise<void> => {
  try {
    isDownloading.value = true;
    let queuedCount = 0;
    let skippedCount = 0;

    for (const video of downloadableFilteredVideos.value) {
      const result = await queueDownload(video);
      if (result === 'queued') {
        queuedCount += 1;
      } else {
        skippedCount += 1;
      }
    }

    if (queuedCount > 0) {
      $q.notify({
        color: 'positive',
        message: skippedCount > 0
          ? `Queued ${queuedCount} downloads, skipped ${skippedCount} already present.`
          : `Queued ${queuedCount} downloads.`,
      });
      await loadLibraryVideos();
    } else {
      $q.notify({ color: 'info', message: 'No new videos matched the current filter.' });
    }
  } catch (error) {
    console.error(error);
    $q.notify({ color: 'negative', message: 'Failed to queue filtered downloads.' });
  } finally {
    isDownloading.value = false;
  }
};

const loadOverview = async (): Promise<void> => {
  const channel = channelInput.value.trim();
  if (!channel) {
    $q.notify({ color: 'warning', message: 'Please enter @channel_name or channel ID.' });
    return;
  }

  try {
    isLoading.value = true;
    const { data } = await apiClient.get<ChannelOverview>('/channels/overview', {
      params: {
        channel,
        maxResults: Math.min(200, Math.max(1, maxResults.value || 100)),
      },
    });
    overview.value = data;
    await loadLibraryVideos();
  } catch (error: unknown) {
    const details = typeof error === 'object' && error !== null && 'response' in error
      ? (error as { response?: { data?: { details?: string; error?: string } } }).response?.data?.details
      ?? (error as { response?: { data?: { details?: string; error?: string } } }).response?.data?.error
      : undefined;

    $q.notify({
      color: 'negative',
      message: details ?? 'Failed to load channel overview.',
    });
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  restoreOverviewState();
  void loadLibraryVideos();
});

watch(
  [channelInput, maxResults, minLengthMinutes, maxLengthMinutes, overview],
  () => {
    saveOverviewState();
  },
  { deep: true },
);
</script>
