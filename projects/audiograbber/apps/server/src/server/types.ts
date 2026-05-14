export type JobState = "queued" | "running" | "success" | "failed";

export type JobKind = "download" | "sync";

export type JobRecord = {
    jobId: string;
    state: JobState;
    progress: number;
    kind: JobKind;
    createdAt: string;
    updatedAt: string;
    externalJobId?: string;
    error?: string;
};

export type DownloadRequest = {
    videoId: string;
    playlistId?: string;
    priority?: number;
    outputFormat?: "mp3" | "source";
    embedMetadata?: boolean;
    songTitle?: string;
    artist?: string;
    album?: string;
};

export type SyncRequest = {
    channelId: string;
    maxResults?: number;
};

export type WorkerSubmission = {
    accepted: boolean;
    externalJobId?: string;
    message?: string;
};

export type LibraryVideoMetadata = {
    fileName: string;
    extension: string;
    mediaType: "audio" | "video";
    sizeBytes: number;
    createdAt: string;
    modifiedAt: string;
};

export type LibraryVideo = {
    id: string;
    title: string;
    status: "ready" | "processing" | "failed";
    artist: string | null;
    album: string | null;
    year: number | null;
    estimatedBpm: number | null;
    estimatedKey: string | null;
    thumbnailUrl?: string;
    metadata: LibraryVideoMetadata;
};
