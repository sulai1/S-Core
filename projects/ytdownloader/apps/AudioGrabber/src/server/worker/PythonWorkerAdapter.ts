import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import path from "node:path";
import ffmpegStatic from "ffmpeg-static";
import nodeID3 from "node-id3";
import { DownloadRequest, SyncRequest, WorkerSubmission } from "../types.js";

const resolvedFfmpegPath = typeof ffmpegStatic === "string" ? ffmpegStatic : undefined;

export interface WorkerAdapter {
    submitDownload(request: DownloadRequest): Promise<WorkerSubmission>;
    submitSync(request: SyncRequest): Promise<WorkerSubmission>;
}

type WorkerMode = "stub" | "ytdlp" | "python";

type MetadataFields = {
    title?: string;
    artist?: string;
    album?: string;
};

type YoutubeApiListResponse<T> = {
    items?: T[];
    nextPageToken?: string;
    error?: {
        message?: string;
    };
};

export class YtDlpWorkerAdapter implements WorkerAdapter {
    private readonly ytDlpBin: string;
    private readonly downloadFolder: string;
    private readonly youtubeBaseUrl: string;
    private readonly apiKey: string;
    private readonly libraryExtensions = new Set([".mp3", ".m4a", ".webm", ".mp4"]);
    private readonly runMode: "stub" | "ytdlp";

    constructor(
        private readonly mode: WorkerMode = (process.env.AUDIOGRABBER_WORKER_MODE as WorkerMode | undefined) ?? "stub",
        private readonly timeoutMs: number = Number(process.env.AUDIOGRABBER_WORKER_TIMEOUT_MS ?? 300000),
    ) {
        this.runMode = this.mode === "python" ? "ytdlp" : this.mode;
        this.ytDlpBin = this.resolveYtDlpBin();
        this.downloadFolder = this.resolveDownloadFolder();
        this.youtubeBaseUrl = (process.env.AUDIOGRABBER_YT_URL ?? "https://youtube.googleapis.com/youtube/v3/").replace(/\/+$/, "");
        this.apiKey = (process.env.AUDIOGRABBER_YT_API_KEY ?? "").trim();
    }

    async submitDownload(request: DownloadRequest): Promise<WorkerSubmission> {
        if (this.runMode !== "ytdlp") {
            return {
                accepted: true,
                externalJobId: randomUUID(),
                message: "stubbed-ytdlp-download",
            };
        }

        const videoId = (request.videoId ?? "").trim();
        if (!videoId) {
            return { accepted: false, message: "missing-videoId" };
        }

        const outputFormat = request.outputFormat ?? "mp3";
        if (!["mp3", "source"].includes(outputFormat)) {
            return { accepted: false, message: `invalid-outputFormat:${outputFormat}` };
        }

        const embedMetadata = request.embedMetadata !== false;
        const metadata = this.metadataFromRequest(request);

        mkdirSync(this.downloadFolder, { recursive: true });

        if (this.hasExistingDownload(videoId)) {
            if (Object.keys(metadata).length > 0) {
                await this.applyMetadataForId(videoId, metadata);
            }
            return {
                accepted: true,
                externalJobId: randomUUID(),
                message: `already-downloaded:${videoId}`,
            };
        }

        if (outputFormat === "mp3" && !resolvedFfmpegPath) {
            return { accepted: false, message: "missing-ffmpeg-binary-for-mp3" };
        }

        const ffmpegLocation = resolvedFfmpegPath ? path.dirname(resolvedFfmpegPath) : undefined;
        const downloadArgs = [
            "--no-progress",
            "--no-warnings",
            "--quiet",
            "--no-playlist",
            "--output",
            path.join(this.downloadFolder, "%(title)s %(id)s.%(ext)s"),
            "--format",
            "bestaudio/best",
        ];

        if (ffmpegLocation) {
            downloadArgs.push("--ffmpeg-location", ffmpegLocation);
        }
        if (embedMetadata) {
            downloadArgs.push("--add-metadata");
        }
        if (outputFormat === "mp3") {
            downloadArgs.push("--extract-audio", "--audio-format", "mp3", "--audio-quality", "192K");
        }

        downloadArgs.push(`https://www.youtube.com/watch?v=${videoId}`);

        try {
            await this.runProcess(this.ytDlpBin, downloadArgs);
        } catch (error) {
            const details = error instanceof Error ? error.message : "yt-dlp-download-failed";
            return { accepted: false, message: details };
        }

        if (outputFormat === "mp3" && !this.hasOutputForId(videoId, [".mp3"])) {
            return {
                accepted: false,
                message: `expected-mp3-output-missing:${videoId}`,
            };
        }

        if (Object.keys(metadata).length > 0) {
            await this.applyMetadataForId(videoId, metadata);
        }

        return {
            accepted: true,
            externalJobId: randomUUID(),
            message: `downloaded:${videoId}:format=${outputFormat}:metadata=${embedMetadata ? "on" : "off"}`,
        };
    }

    async submitSync(request: SyncRequest): Promise<WorkerSubmission> {
        if (this.runMode !== "ytdlp") {
            return {
                accepted: true,
                externalJobId: randomUUID(),
                message: "stubbed-ytdlp-sync",
            };
        }

        const channelId = (request.channelId ?? "").trim();
        if (!channelId) {
            return { accepted: false, message: "missing-channelId" };
        }
        if (!this.apiKey) {
            return { accepted: false, message: "missing-api-key" };
        }

        mkdirSync(this.downloadFolder, { recursive: true });

        const uploadsPlaylistId = await this.resolveUploadsPlaylist(channelId);
        if (!uploadsPlaylistId) {
            return { accepted: false, message: `uploads-playlist-not-found:${channelId}` };
        }

        const maxResults = Math.max(1, Math.min(Number(request.maxResults ?? 50), 50));
        const videoIds = await this.getPlaylistVideoIds(uploadsPlaylistId, maxResults);
        const newIds = videoIds.filter((videoId) => !this.hasExistingDownload(videoId));

        for (const videoId of newIds) {
            const result = await this.submitDownload({
                videoId,
                outputFormat: "mp3",
                embedMetadata: true,
            });
            if (!result.accepted) {
                return { accepted: false, message: `sync-download-failed:${videoId}:${result.message ?? "unknown"}` };
            }
        }

        return {
            accepted: true,
            externalJobId: randomUUID(),
            message: `sync-complete:${newIds.length}-new`,
        };
    }

    private resolveYtDlpBin(): string {
        const configured = process.env.AUDIOGRABBER_YT_DLP_BIN;
        if (configured) {
            return configured;
        }

        const candidates = [
            path.resolve(process.cwd(), ".venv/bin/yt-dlp"),
            path.resolve(process.cwd(), "projects/ytdownloader/apps/AudioGrabber/.venv/bin/yt-dlp"),
            "yt-dlp",
        ];

        for (const candidate of candidates) {
            if (!candidate.includes(path.sep) || existsSync(candidate)) {
                return candidate;
            }
        }

        return "yt-dlp";
    }

    private resolveDownloadFolder(): string {
        const configured = process.env.AUDIOGRABBER_DOWNLOAD_FOLDER ?? "download";
        return path.isAbsolute(configured)
            ? configured
            : path.resolve(process.cwd(), configured);
    }

    private metadataFromRequest(request: DownloadRequest): MetadataFields {
        const title = (request.songTitle ?? "").trim();
        const artist = (request.artist ?? "").trim();
        const album = (request.album ?? "").trim();
        return {
            title: title || undefined,
            artist: artist || undefined,
            album: album || undefined,
        };
    }

    private hasExistingDownload(videoId: string): boolean {
        if (!existsSync(this.downloadFolder)) {
            return false;
        }

        return readdirSync(this.downloadFolder)
            .some((fileName) => this.libraryExtensions.has(path.extname(fileName).toLowerCase()) && fileName.includes(videoId));
    }

    private hasOutputForId(videoId: string, extensions: string[]): boolean {
        if (!existsSync(this.downloadFolder)) {
            return false;
        }

        const normalized = new Set(extensions.map((ext) => ext.toLowerCase()));
        return readdirSync(this.downloadFolder)
            .some((fileName) => fileName.includes(videoId) && normalized.has(path.extname(fileName).toLowerCase()));
    }

    private findOutputPaths(videoId: string): string[] {
        if (!existsSync(this.downloadFolder)) {
            return [];
        }

        return readdirSync(this.downloadFolder)
            .filter((fileName) => fileName.includes(videoId))
            .filter((fileName) => !fileName.endsWith(".part") && !fileName.endsWith(".ytdl"))
            .map((fileName) => path.join(this.downloadFolder, fileName));
    }

    private async applyMetadataForId(videoId: string, metadata: MetadataFields): Promise<void> {
        const paths = this.findOutputPaths(videoId);
        for (const outputPath of paths) {
            try {
                await this.applyMetadataToFile(outputPath, metadata);
            } catch (error) {
                const details = error instanceof Error ? error.message : String(error);
                console.error(`failed to apply metadata on ${outputPath}: ${details}`);
            }
        }
    }

    private async applyMetadataToFile(filePath: string, metadata: MetadataFields): Promise<void> {
        const title = metadata.title?.trim();
        const artist = metadata.artist?.trim();
        const album = metadata.album?.trim();

        if (!title && !artist && !album) {
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        if (ext === ".mp3") {
            const tags: nodeID3.Tags = {};
            if (title) {
                tags.title = title;
            }
            if (artist) {
                tags.artist = artist;
            }
            if (album) {
                tags.album = album;
            }
            nodeID3.write(tags, filePath);
            return;
        }

        if (![".m4a", ".mp4"].includes(ext) || !resolvedFfmpegPath) {
            return;
        }

        const tempPath = `${filePath}.meta-tmp-${Date.now()}`;
        const ffmpegArgs = ["-y", "-i", filePath, "-map", "0", "-c", "copy"];
        if (title) {
            ffmpegArgs.push("-metadata", `title=${title}`);
        }
        if (artist) {
            ffmpegArgs.push("-metadata", `artist=${artist}`);
        }
        if (album) {
            ffmpegArgs.push("-metadata", `album=${album}`);
        }
        ffmpegArgs.push(tempPath);

        try {
            await this.runProcess(resolvedFfmpegPath, ffmpegArgs);
            renameSync(tempPath, filePath);
        } finally {
            rmSync(tempPath, { force: true });
        }
    }

    private async resolveUploadsPlaylist(channelId: string): Promise<string | undefined> {
        const channelsResponse = await this.youtubeGet<{ contentDetails?: { relatedPlaylists?: { uploads?: string } } }>(
            "channels",
            {
                key: this.apiKey,
                part: "contentDetails",
                id: channelId,
                maxResults: "1",
            },
        );

        return channelsResponse.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    }

    private async getPlaylistVideoIds(playlistId: string, maxResults: number): Promise<string[]> {
        const response = await this.youtubeGet<{ snippet?: { resourceId?: { videoId?: string } } }>("playlistItems", {
            key: this.apiKey,
            part: "snippet",
            playlistId,
            maxResults: String(maxResults),
        });

        return (response.items ?? [])
            .map((item) => item.snippet?.resourceId?.videoId)
            .filter((videoId): videoId is string => Boolean(videoId));
    }

    private async youtubeGet<T>(resource: string, params: Record<string, string>): Promise<YoutubeApiListResponse<T>> {
        const query = new URLSearchParams(params);
        const url = `${this.youtubeBaseUrl}/${resource}?${query.toString()}`;
        const response = await fetch(url);
        const data = await response.json() as YoutubeApiListResponse<T>;

        if (!response.ok) {
            const message = data?.error?.message ?? `youtube-api-http-${response.status}`;
            throw new Error(`youtube-api-request-failed:${message}`);
        }

        return data;
    }

    private runProcess(command: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
        return new Promise((resolve, reject) => {
            const processHandle = spawn(command, args, {
                stdio: ["ignore", "pipe", "pipe"],
            });

            let stdout = "";
            let stderr = "";

            const timeout = setTimeout(() => {
                processHandle.kill();
                reject(new Error(`worker-timeout-${this.timeoutMs}ms`));
            }, this.timeoutMs);

            processHandle.stdout.on("data", (chunk: Buffer) => {
                stdout += chunk.toString();
            });

            processHandle.stderr.on("data", (chunk: Buffer) => {
                stderr += chunk.toString();
            });

            processHandle.on("error", (error: Error) => {
                clearTimeout(timeout);
                reject(error);
            });

            processHandle.on("close", (code: number | null) => {
                clearTimeout(timeout);
                if (code !== 0) {
                    reject(new Error(`worker-exit-${String(code)}:${stderr.trim() || stdout.trim()}`));
                    return;
                }

                resolve({ stdout, stderr });
            });
        });
    }
}

// Backward compatibility while callers migrate imports.
export { YtDlpWorkerAdapter as PythonWorkerAdapter };
