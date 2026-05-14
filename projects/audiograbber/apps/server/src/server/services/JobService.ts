import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { DataSource, Repository } from "typeorm";
import { JobRepository } from "../../database/repositories/job.repository.js";
import { DbJob } from "../../database/entities/job.entity.js";
import { MediaFile, MediaFileEntity } from "../../database/entities/media-file.entity.js";
import { DownloadRequest, JobRecord, LibraryVideo, SyncRequest } from "../types.js";
import { WorkerAdapter } from "../worker/PythonWorkerAdapter.js";

function toJobRecord(job: DbJob): JobRecord {
    return {
        jobId: job.id,
        state: job.state,
        progress: job.progress,
        kind: job.kind,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
        externalJobId: job.externalJobId ?? undefined,
        error: job.error ?? undefined,
    };
}

export class JobService {
    private readonly jobRepo: JobRepository;
    private readonly mediaRepo: Repository<MediaFile>;
    private readonly downloadFolder: string;
    private readonly libraryExtensions = new Set([".mp3", ".m4a", ".webm", ".mp4"]);
    private readonly audioExtensions = new Set([".mp3", ".m4a"]);
    private readonly videoExtensions = new Set([".mp4", ".webm"]);

    constructor(
        private readonly worker: WorkerAdapter,
        dataSource: DataSource,
    ) {
        this.jobRepo = new JobRepository(dataSource);
        this.mediaRepo = dataSource.getRepository(MediaFileEntity);
        this.downloadFolder = path.isAbsolute(process.env.AUDIOGRABBER_DOWNLOAD_FOLDER ?? "download")
            ? (process.env.AUDIOGRABBER_DOWNLOAD_FOLDER ?? "download")
            : path.resolve(process.cwd(), process.env.AUDIOGRABBER_DOWNLOAD_FOLDER ?? "download");
    }

    async queueDownload(request: DownloadRequest): Promise<JobRecord> {
        const job = await this.jobRepo.create({ kind: "download" });

        if (this.hasExistingDownload(request.videoId)) {
            await this.persistMediaFile(request.videoId, request);
            await this.jobRepo.patch(job.id, { state: "success", progress: 100 });
            return toJobRecord({ ...job, state: "success", progress: 100 });
        }

        this.dispatchDownload(job.id, request).catch((error: unknown) => {
            this.failJob(job.id, error);
        });

        return toJobRecord(job);
    }

    async queueSync(request: SyncRequest): Promise<JobRecord> {
        const job = await this.jobRepo.create({ kind: "sync" });

        this.dispatchSync(job.id, request).catch((error: unknown) => {
            this.failJob(job.id, error);
        });

        return toJobRecord(job);
    }

    async getJob(jobId: string): Promise<JobRecord | undefined> {
        const job = await this.jobRepo.findById(jobId);
        return job ? toJobRecord(job) : undefined;
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

    private async dispatchDownload(jobId: string, request: DownloadRequest): Promise<void> {
        await this.jobRepo.patch(jobId, { state: "running", progress: 15 });
        const result = await this.worker.submitDownload(request);
        if (!result.accepted) {
            throw new Error(result.message ?? "worker-rejected-download");
        }

        await this.persistMediaFile(request.videoId, request);

        await this.jobRepo.patch(jobId, {
            state: "success",
            progress: 100,
            externalJobId: result.externalJobId,
        });
    }

    private async dispatchSync(jobId: string, request: SyncRequest): Promise<void> {
        await this.jobRepo.patch(jobId, { state: "running", progress: 20 });
        const result = await this.worker.submitSync(request);
        if (!result.accepted) {
            throw new Error(result.message ?? "worker-rejected-sync");
        }

        await this.jobRepo.patch(jobId, {
            state: "success",
            progress: 100,
            externalJobId: result.externalJobId,
        });
    }

    private async failJob(jobId: string, error: unknown): Promise<void> {
        const message = error instanceof Error ? error.message : "unknown-worker-error";
        await this.jobRepo.patch(jobId, { state: "failed", error: message });
    }

    private hasExistingDownload(videoId: string): boolean {
        if (!existsSync(this.downloadFolder)) {
            return false;
        }

        return readdirSync(this.downloadFolder)
            .some((fileName) => this.libraryExtensions.has(path.extname(fileName).toLowerCase()) && fileName.includes(videoId));
    }

    private async persistMediaFile(videoId: string, request: DownloadRequest): Promise<void> {
        const output = this.findPrimaryOutput(videoId);
        if (!output) {
            throw new Error(`downloaded-output-missing:${videoId}`);
        }

        const outputPath = path.join(this.downloadFolder, output.fileName);
        const stats = statSync(outputPath);
        const info = this.readInfoJson(videoId);

        const titleFromFile = output.baseName.replace(/\s+[a-zA-Z0-9_-]{11}$/, "").trim();
        const title = (request.songTitle ?? "").trim() || (info?.title ?? "").trim() || titleFromFile || output.baseName;
        const artist = (request.artist ?? "").trim() || (typeof info?.artist === "string" ? info.artist.trim() : "") || null;
        const album = (request.album ?? "").trim() || (typeof info?.album === "string" ? info.album.trim() : "") || null;

        const tags = Array.isArray(info?.tags)
            ? info.tags.filter((value): value is string => typeof value === "string").map((value) => value.trim()).filter(Boolean)
            : [];

        const mimeType = this.inferMimeType(output.extension);
        const durationSecs = typeof info?.duration === "number" ? info.duration : null;
        const year = typeof info?.release_year === "number"
            ? info.release_year
            : typeof info?.upload_date === "string" && info.upload_date.length >= 4
                ? parseInt(info.upload_date.slice(0, 4), 10)
                : null;
        const existing = await this.mediaRepo.findOneBy({ youtubeVideoId: videoId });

        if (existing) {
            await this.mediaRepo.update(existing.id, {
                filePath: outputPath,
                mimeType,
                durationSecs,
                title,
                artist,
                album,
                videoTags: tags.length > 0 ? JSON.stringify(tags) : null,
                year,
            });
            return;
        }

        const entry = this.mediaRepo.create({
            youtubeVideoId: videoId,
            filePath: outputPath,
            mimeType,
            durationSecs,
            ownerId: null,
            visibility: "owner",
            allowedGroups: null,
            title,
            artist,
            album,
            videoTags: tags.length > 0 ? JSON.stringify(tags) : null,
            year,
            createdAt: stats.birthtime,
        });
        await this.mediaRepo.save(entry);
    }

    private findPrimaryOutput(videoId: string): { fileName: string; extension: string; baseName: string } | undefined {
        if (!existsSync(this.downloadFolder)) {
            return undefined;
        }

        const candidates = readdirSync(this.downloadFolder)
            .filter((fileName) => fileName.includes(videoId))
            .filter((fileName) => this.libraryExtensions.has(path.extname(fileName).toLowerCase()))
            .map((fileName) => {
                const fullPath = path.join(this.downloadFolder, fileName);
                const extension = path.extname(fileName).toLowerCase();
                const baseName = path.basename(fileName, extension);
                const modifiedAt = statSync(fullPath).mtimeMs;
                return { fileName, extension, baseName, modifiedAt };
            })
            .sort((a, b) => b.modifiedAt - a.modifiedAt);

        if (candidates.length === 0) {
            return undefined;
        }

        const selected = candidates[0];
        return {
            fileName: selected.fileName,
            extension: selected.extension,
            baseName: selected.baseName,
        };
    }

    private readInfoJson(videoId: string): { title?: string; artist?: string; album?: string; tags?: unknown[]; duration?: number; release_year?: number; upload_date?: string } | undefined {
        if (!existsSync(this.downloadFolder)) {
            return undefined;
        }

        const jsonFiles = readdirSync(this.downloadFolder)
            .filter((fileName) => fileName.includes(videoId) && fileName.endsWith(".info.json"))
            .map((fileName) => {
                const fullPath = path.join(this.downloadFolder, fileName);
                return {
                    fullPath,
                    modifiedAt: statSync(fullPath).mtimeMs,
                };
            })
            .sort((a, b) => b.modifiedAt - a.modifiedAt);

        if (jsonFiles.length === 0) {
            return undefined;
        }

        try {
            const raw = readFileSync(jsonFiles[0].fullPath, "utf8");
            const parsed = JSON.parse(raw) as {
                title?: string;
                artist?: string;
                album?: string;
                tags?: unknown[];
                duration?: number;
                release_year?: number;
                upload_date?: string;
            };
            return parsed;
        } catch {
            return undefined;
        }
    }

    private inferMimeType(extension: string): string {
        switch (extension.toLowerCase()) {
            case ".mp3":
                return "audio/mpeg";
            case ".m4a":
                return "audio/mp4";
            case ".mp4":
                return "video/mp4";
            case ".webm":
                return "video/webm";
            default:
                return "application/octet-stream";
        }
    }
}
