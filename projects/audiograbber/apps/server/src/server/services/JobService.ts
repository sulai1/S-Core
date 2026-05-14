import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import { DataSource, Repository } from "typeorm";
import { JobRepository } from "../../database/repositories/job.repository.js";
import { DbJob } from "../../database/entities/job.entity.js";
import { AudioFingerprint, AudioFingerprintEntity } from "../../database/entities/audio-fingerprint.entity.js";
import { MediaFile, MediaFileEntity } from "../../database/entities/media-file.entity.js";
import { DownloadRequest, JobRecord, LibraryVideo, SyncRequest } from "../types.js";
import { WorkerAdapter } from "../worker/PythonWorkerAdapter.js";
import {
    AUDIOGRABBER_DOWNLOAD_FAILED_FOLDER,
    AUDIOGRABBER_DOWNLOAD_FOLDER,
    AUDIOGRABBER_DOWNLOAD_TMP_FOLDER,
} from "../storagePaths.js";

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
    private readonly fingerprintRepo: Repository<AudioFingerprint>;
    private readonly downloadFolder: string;
    private readonly libraryExtensions = new Set([".mp3", ".m4a", ".webm", ".mp4"]);
    private readonly audioExtensions = new Set([".mp3", ".m4a"]);
    private readonly videoExtensions = new Set([".mp4", ".webm"]);
    private fpcalcAvailable: boolean | undefined;
    private ffmpegAvailable: boolean | undefined;

    constructor(
        private readonly worker: WorkerAdapter,
        dataSource: DataSource,
    ) {
        this.jobRepo = new JobRepository(dataSource);
        this.mediaRepo = dataSource.getRepository(MediaFileEntity);
        this.fingerprintRepo = dataSource.getRepository(AudioFingerprintEntity);
        this.downloadFolder = AUDIOGRABBER_DOWNLOAD_FOLDER;

        mkdirSync(AUDIOGRABBER_DOWNLOAD_FOLDER, { recursive: true });
        mkdirSync(AUDIOGRABBER_DOWNLOAD_TMP_FOLDER, { recursive: true });
        mkdirSync(AUDIOGRABBER_DOWNLOAD_FAILED_FOLDER, { recursive: true });

        this.ensureFpcalcAvailable();
    }

    async queueDownload(request: DownloadRequest): Promise<JobRecord> {
        const job = await this.jobRepo.create({ kind: "download" });

        if (this.hasExistingDownload(request.videoId)) {
            const media = await this.persistMediaFile(request.videoId, request);
            await this.processFingerprint(media);
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

        const media = await this.persistMediaFile(request.videoId, request);
        await this.processFingerprint(media);

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

    private async persistMediaFile(videoId: string, request: DownloadRequest): Promise<MediaFile> {
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

        const features = this.estimateAudioFeatures(outputPath);

        const mimeType = this.inferMimeType(output.extension);
        const durationSecs = typeof info?.duration === "number" ? info.duration : null;
        const year = typeof info?.release_year === "number"
            ? info.release_year
            : typeof info?.upload_date === "string" && info.upload_date.length >= 4
                ? parseInt(info.upload_date.slice(0, 4), 10)
                : null;
        const estimatedBpm = typeof info?.bpm === "number" ? info.bpm : features.estimatedBpm;
        const estimatedKey = this.normalizeEstimatedKey(
            typeof info?.key === "string"
                ? info.key
                : typeof info?.musical_key === "string"
                    ? info.musical_key
                    : features.estimatedKey,
        );
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
                estimatedBpm,
                estimatedKey,
            });
            return await this.mediaRepo.findOneByOrFail({ id: existing.id });
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
            estimatedBpm,
            estimatedKey,
            createdAt: stats.birthtime,
        });
        return await this.mediaRepo.save(entry);
    }

    private async processFingerprint(media: MediaFile): Promise<void> {
        const fingerprint = this.generateFingerprint(media.filePath);
        if (!fingerprint) {
            return;
        }

        const duplicate = await this.fingerprintRepo.findOneBy({ fingerprintData: fingerprint });
        if (duplicate && duplicate.mediaFileId !== media.id) {
            const existingMedia = await this.mediaRepo.findOneBy({ id: duplicate.mediaFileId });
            if (existingMedia) {
                const currentPath = media.filePath;
                const canonicalPath = existingMedia.filePath;
                if (currentPath !== canonicalPath && existsSync(currentPath)) {
                    try {
                        unlinkSync(currentPath);
                    } catch {
                        // best effort cleanup of duplicate file
                    }
                }

                await this.mediaRepo.update(media.id, { filePath: canonicalPath });
            }
        }

        const existingFingerprint = await this.fingerprintRepo.findOneBy({ mediaFileId: media.id });
        if (existingFingerprint) {
            await this.fingerprintRepo.update(existingFingerprint.id, { fingerprintData: fingerprint });
            return;
        }

        const created = this.fingerprintRepo.create({
            mediaFileId: media.id,
            fingerprintData: fingerprint,
            acoustIdRecordingId: null,
            acoustIdScore: null,
            enrichedAt: null,
        });
        await this.fingerprintRepo.save(created);
    }

    private generateFingerprint(filePath: string): string | null {
        if (!this.ensureFpcalcAvailable()) {
            return null;
        }

        const bin = this.resolveFpcalcBin();
        const result = spawnSync(bin, ["-json", filePath], { encoding: "utf8" });
        if (result.status !== 0 || typeof result.stdout !== "string") {
            return null;
        }

        try {
            const parsed = JSON.parse(result.stdout) as { fingerprint?: unknown };
            return typeof parsed.fingerprint === "string" && parsed.fingerprint.trim().length > 0
                ? parsed.fingerprint.trim()
                : null;
        } catch {
            return null;
        }
    }

    private ensureFpcalcAvailable(): boolean {
        if (typeof this.fpcalcAvailable === "boolean") {
            return this.fpcalcAvailable;
        }

        const bin = this.resolveFpcalcBin();
        const result = spawnSync(bin, ["-version"], { encoding: "utf8" });
        this.fpcalcAvailable = result.status === 0;

        if (!this.fpcalcAvailable) {
            console.warn("[AudioGrabber] Warning: fpcalc not available; fingerprint generation is disabled. Install libchromaprint-tools or set AUDIOGRABBER_FPCALC_BIN.");
        }

        return this.fpcalcAvailable;
    }

    private resolveFpcalcBin(): string {
        const envBin = (process.env.AUDIOGRABBER_FPCALC_BIN ?? "").trim();
        return envBin || "fpcalc";
    }

    private estimateAudioFeatures(filePath: string): { estimatedBpm: number | null; estimatedKey: string | null } {
        if (!this.ensureFfmpegAvailable()) {
            return { estimatedBpm: null, estimatedKey: null };
        }

        const ffmpegBin = this.resolveFfmpegBin();
        const sampleRate = 11025;
        const decode = spawnSync(
            ffmpegBin,
            ["-hide_banner", "-loglevel", "error", "-i", filePath, "-ac", "1", "-ar", String(sampleRate), "-t", "90", "-f", "s16le", "pipe:1"],
            { encoding: null, maxBuffer: 1024 * 1024 * 64 },
        );

        if (decode.status !== 0 || !decode.stdout || !(decode.stdout instanceof Buffer) || decode.stdout.length < 4096) {
            return { estimatedBpm: null, estimatedKey: null };
        }

        const int16 = new Int16Array(decode.stdout.buffer, decode.stdout.byteOffset, Math.floor(decode.stdout.length / 2));
        const samples = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i += 1) {
            samples[i] = int16[i] / 32768;
        }

        return {
            estimatedBpm: this.estimateBpm(samples, sampleRate),
            estimatedKey: this.estimateKeyFromPitchClass(samples, sampleRate),
        };
    }

    private estimateBpm(samples: Float32Array, sampleRate: number): number | null {
        const frameSize = 1024;
        const hopSize = 512;
        const frameCount = Math.floor((samples.length - frameSize) / hopSize);
        if (frameCount < 32) {
            return null;
        }

        const energy = new Float32Array(frameCount);
        for (let frame = 0; frame < frameCount; frame += 1) {
            const start = frame * hopSize;
            let sum = 0;
            for (let i = 0; i < frameSize; i += 1) {
                const v = samples[start + i];
                sum += v * v;
            }
            energy[frame] = sum;
        }

        const onset = new Float32Array(frameCount);
        for (let i = 1; i < frameCount; i += 1) {
            const diff = energy[i] - energy[i - 1];
            onset[i] = diff > 0 ? diff : 0;
        }

        const minBpm = 70;
        const maxBpm = 190;
        const minLag = Math.floor((60 * sampleRate) / (maxBpm * hopSize));
        const maxLag = Math.ceil((60 * sampleRate) / (minBpm * hopSize));

        let bestLag = 0;
        let bestScore = Number.NEGATIVE_INFINITY;

        for (let lag = minLag; lag <= maxLag; lag += 1) {
            let score = 0;
            for (let i = lag; i < onset.length; i += 1) {
                score += onset[i] * onset[i - lag];
            }

            if (score > bestScore) {
                bestScore = score;
                bestLag = lag;
            }
        }

        if (bestLag <= 0 || !Number.isFinite(bestScore) || bestScore <= 0) {
            return null;
        }

        const bpm = (60 * sampleRate) / (bestLag * hopSize);
        if (!Number.isFinite(bpm) || bpm < 50 || bpm > 220) {
            return null;
        }

        return Math.round(bpm * 10) / 10;
    }

    private estimateKeyFromPitchClass(samples: Float32Array, sampleRate: number): string | null {
        const windowSize = 2048;
        const hop = 1024;
        const minFreq = 80;
        const maxFreq = 1000;
        const minLag = Math.floor(sampleRate / maxFreq);
        const maxLag = Math.ceil(sampleRate / minFreq);

        const pitchClassVotes = new Array<number>(12).fill(0);
        const availableFrames = Math.floor((samples.length - windowSize) / hop);
        if (availableFrames < 8) {
            return null;
        }

        const maxFrames = 120;
        const step = Math.max(1, Math.floor(availableFrames / maxFrames));

        for (let frame = 0; frame < availableFrames; frame += step) {
            const start = frame * hop;
            let bestLag = 0;
            let bestScore = Number.NEGATIVE_INFINITY;

            for (let lag = minLag; lag <= maxLag; lag += 1) {
                let corr = 0;
                for (let i = 0; i < windowSize - lag; i += 1) {
                    corr += samples[start + i] * samples[start + i + lag];
                }

                if (corr > bestScore) {
                    bestScore = corr;
                    bestLag = lag;
                }
            }

            if (bestLag <= 0 || bestScore <= 0) {
                continue;
            }

            const freq = sampleRate / bestLag;
            if (!Number.isFinite(freq) || freq < minFreq || freq > maxFreq) {
                continue;
            }

            const midi = 69 + 12 * Math.log2(freq / 440);
            const pitchClass = ((Math.round(midi) % 12) + 12) % 12;
            pitchClassVotes[pitchClass] += 1;
        }

        let bestClass = -1;
        let bestVotes = 0;
        for (let i = 0; i < pitchClassVotes.length; i += 1) {
            if (pitchClassVotes[i] > bestVotes) {
                bestVotes = pitchClassVotes[i];
                bestClass = i;
            }
        }

        if (bestClass < 0 || bestVotes < 3) {
            return null;
        }

        const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        return notes[bestClass] ?? null;
    }

    private normalizeEstimatedKey(value: string | null): string | null {
        if (!value) {
            return null;
        }

        const normalized = value.trim();
        return normalized.length > 0 ? normalized : null;
    }

    private ensureFfmpegAvailable(): boolean {
        if (typeof this.ffmpegAvailable === "boolean") {
            return this.ffmpegAvailable;
        }

        const ffmpegBin = this.resolveFfmpegBin();
        const result = spawnSync(ffmpegBin, ["-version"], { encoding: "utf8" });
        this.ffmpegAvailable = result.status === 0;

        if (!this.ffmpegAvailable) {
            console.warn("[AudioGrabber] Warning: ffmpeg not available; estimated BPM/key generation is disabled. Install ffmpeg or set AUDIOGRABBER_FFMPEG_BIN.");
        }

        return this.ffmpegAvailable;
    }

    private resolveFfmpegBin(): string {
        const envBin = (process.env.AUDIOGRABBER_FFMPEG_BIN ?? "").trim();
        if (envBin) {
            return envBin;
        }

        const bundledFfmpegPath = ffmpegPath as unknown;
        if (typeof bundledFfmpegPath === "string" && bundledFfmpegPath.length > 0) {
            return bundledFfmpegPath;
        }

        return "ffmpeg";
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

    private readInfoJson(videoId: string): { title?: string; artist?: string; album?: string; tags?: unknown[]; duration?: number; release_year?: number; upload_date?: string; bpm?: number; key?: string; musical_key?: string } | undefined {
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
                bpm?: number;
                key?: string;
                musical_key?: string;
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
