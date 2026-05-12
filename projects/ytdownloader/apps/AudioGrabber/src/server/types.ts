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

export type LibraryVideo = {
    id: string;
    title: string;
    status: "ready" | "processing" | "failed";
};
