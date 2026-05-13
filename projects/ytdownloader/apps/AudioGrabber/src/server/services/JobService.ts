import { randomUUID } from "node:crypto";
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { DownloadRequest, JobRecord, LibraryVideo, SyncRequest } from "../types.js";
import { JobStore } from "./JobStore.js";
import { WorkerAdapter } from "../worker/PythonWorkerAdapter.js";

export class JobService {
    private readonly jobs = new Map<string, JobRecord>();
    private readonly downloadFolder: string;
    private readonly libraryExtensions = new Set([".mp3", ".m4a", ".webm", ".mp4"]);
    private readonly audioExtensions = new Set([".mp3", ".m4a"]);
    private readonly videoExtensions = new Set([".mp4", ".webm"]);

    constructor(
        private readonly worker: WorkerAdapter,
        private readonly store: JobStore = new JobStore(),
    ) {
        this.downloadFolder = path.isAbsolute(process.env.AUDIOGRABBER_DOWNLOAD_FOLDER ?? "download")
            ? (process.env.AUDIOGRABBER_DOWNLOAD_FOLDER ?? "download")
            : path.resolve(process.cwd(), process.env.AUDIOGRABBER_DOWNLOAD_FOLDER ?? "download");

        for (const job of this.store.load()) {
            this.jobs.set(job.jobId, job);
        }
    }

    queueDownload(request: DownloadRequest): JobRecord {
        const job = this.createJob("download");
        if (this.hasExistingDownload(request.videoId)) {
            this.updateJob(job.jobId, {
                state: "success",
                progress: 100,
            });
            return this.getJob(job.jobId) ?? job;
        }

        this.dispatchDownload(job.jobId, request).catch((error: unknown) => {
            this.failJob(job.jobId, error);
        });
        return job;
    }

    queueSync(request: SyncRequest): JobRecord {
        const job = this.createJob("sync");
        this.dispatchSync(job.jobId, request).catch((error: unknown) => {
            this.failJob(job.jobId, error);
        });
        return job;
    }

    getJob(jobId: string): JobRecord | undefined {
        return this.jobs.get(jobId);
    }

    listVideos(limit?: number, keyword?: string, mediaType: "all" | "audio" | "video" = "all"): { items: LibraryVideo[] } {
        if (!existsSync(this.downloadFolder)) {
            return { items: [] };
        }

        const normalizedKeyword = (keyword ?? "").trim().toLowerCase();
        const items = readdirSync(this.downloadFolder)
            .filter((fileName) => this.libraryExtensions.has(path.extname(fileName).toLowerCase()))
            .filter((fileName) => {
                if (mediaType === "all") {
                    return true;
                }

                const extension = path.extname(fileName).toLowerCase();
                if (mediaType === "audio") {
                    return this.audioExtensions.has(extension);
                }

                return this.videoExtensions.has(extension);
            })
            .filter((fileName) => {
                if (!normalizedKeyword) {
                    return true;
                }

                return fileName.toLowerCase().includes(normalizedKeyword);
            })
            .map((fileName) => {
                const ext = path.extname(fileName);
                const normalizedExt = ext.toLowerCase();
                const baseName = path.basename(fileName, ext);
                const idMatch = fileName.match(/([a-zA-Z0-9_-]{11})\.[^.]+$/);
                const id = idMatch?.[1] ?? baseName;
                const title = baseName.replace(/\s+[a-zA-Z0-9_-]{11}$/, "").trim();
                const fullPath = path.join(this.downloadFolder, fileName);
                const stats = statSync(fullPath);
                const mediaType: "audio" | "video" = this.audioExtensions.has(normalizedExt) ? "audio" : "video";

                return {
                    id,
                    title: title.length > 0 ? title : baseName,
                    status: "ready" as const,
                    metadata: {
                        fileName,
                        extension: normalizedExt,
                        mediaType,
                        sizeBytes: stats.size,
                        createdAt: stats.birthtime.toISOString(),
                        modifiedAt: stats.mtime.toISOString(),
                    },
                };
            })
            .sort((a, b) => a.title.localeCompare(b.title));

        if (typeof limit === "number" && limit > 0) {
            return { items: items.slice(0, limit) };
        }

        return { items };
    }

    private persist(): void {
        this.store.save(Array.from(this.jobs.values()));
    }

    private createJob(kind: JobRecord["kind"]): JobRecord {
        const now = new Date().toISOString();
        const job: JobRecord = {
            jobId: randomUUID(),
            state: "queued",
            progress: 0,
            kind,
            createdAt: now,
            updatedAt: now,
        };

        this.jobs.set(job.jobId, job);
        this.persist();
        return job;
    }

    private async dispatchDownload(jobId: string, request: DownloadRequest): Promise<void> {
        this.updateJob(jobId, { state: "running", progress: 15 });
        const result = await this.worker.submitDownload(request);
        if (!result.accepted) {
            throw new Error(result.message ?? "worker-rejected-download");
        }

        this.updateJob(jobId, {
            state: "success",
            progress: 100,
            externalJobId: result.externalJobId,
        });
    }

    private async dispatchSync(jobId: string, request: SyncRequest): Promise<void> {
        this.updateJob(jobId, { state: "running", progress: 20 });
        const result = await this.worker.submitSync(request);
        if (!result.accepted) {
            throw new Error(result.message ?? "worker-rejected-sync");
        }

        this.updateJob(jobId, {
            state: "success",
            progress: 100,
            externalJobId: result.externalJobId,
        });
    }

    private updateJob(jobId: string, patch: Partial<JobRecord>): void {
        const current = this.jobs.get(jobId);
        if (!current) {
            return;
        }

        this.jobs.set(jobId, {
            ...current,
            ...patch,
            updatedAt: new Date().toISOString(),
        });
        this.persist();
    }

    private failJob(jobId: string, error: unknown): void {
        const message = error instanceof Error ? error.message : "unknown-worker-error";
        this.updateJob(jobId, { state: "failed", error: message });
    }

    private hasExistingDownload(videoId: string): boolean {
        if (!existsSync(this.downloadFolder)) {
            return false;
        }

        return readdirSync(this.downloadFolder)
            .some((fileName) => this.libraryExtensions.has(path.extname(fileName).toLowerCase()) && fileName.includes(videoId));
    }
}
