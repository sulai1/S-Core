import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegStatic from "ffmpeg-static";
import nodeID3 from "node-id3";
import { DownloadRequest, SyncRequest, WorkerSubmission } from "../types.js";
import {
    AUDIOGRABBER_DOWNLOAD_FAILED_FOLDER,
    AUDIOGRABBER_DOWNLOAD_FOLDER,
    AUDIOGRABBER_DOWNLOAD_TMP_FOLDER,
} from "../storagePaths.js";

const resolvedFfmpegPath = typeof ffmpegStatic === "string" ? ffmpegStatic : undefined;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface WorkerAdapter {
    submitDownload(request: DownloadRequest, onProgress?: WorkerProgressCallback): Promise<WorkerSubmission>;
    submitSync(request: SyncRequest): Promise<WorkerSubmission>;
}

export type WorkerProgress = {
    percent?: number;
    phase?: "downloading" | "postprocessing";
};

export type WorkerProgressCallback = (progress: WorkerProgress) => void;

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

type RunProcessOptions = {
    onStdoutLine?: (line: string) => void;
    onStderrLine?: (line: string) => void;
};

export class YtDlpWorkerAdapter implements WorkerAdapter {
    private readonly ytDlpBin: string;
    private readonly downloadFolder: string;
    private readonly tmpFolder: string;
    private readonly failedFolder: string;
    private readonly failureLogPath: string;
    private readonly youtubeBaseUrl: string;
    private readonly apiKey: string;
    private readonly ytDlpCookiesPath: string;
    private readonly ytDlpCookiesFromBrowser: string;
    private readonly libraryExtensions = new Set([".mp3", ".m4a", ".webm", ".mp4"]);
    private readonly finalExtensions = new Set([".mp3", ".mp4"]);
    private readonly runMode: "stub" | "ytdlp";

    constructor(
        private readonly mode: WorkerMode = (process.env.AUDIOGRABBER_WORKER_MODE as WorkerMode | undefined) ?? "ytdlp",
        private readonly timeoutMs: number = Number(process.env.AUDIOGRABBER_WORKER_TIMEOUT_MS ?? 300000),
    ) {
        this.runMode = this.mode === "python" ? "ytdlp" : this.mode;
        this.ytDlpBin = this.resolveYtDlpBin();
        this.downloadFolder = this.resolveDownloadFolder();
        this.tmpFolder = this.resolveTmpFolder();
        this.failedFolder = this.resolveFailedFolder();
        this.failureLogPath = this.resolveFailureLogPath();
        this.youtubeBaseUrl = (process.env.AUDIOGRABBER_YT_URL ?? "https://youtube.googleapis.com/youtube/v3/").replace(/\/+$/, "");
        this.apiKey = (process.env.AUDIOGRABBER_YT_API_KEY ?? "").trim();
        this.ytDlpCookiesPath = (process.env.AUDIOGRABBER_YT_DLP_COOKIES_FILE ?? "").trim();
        this.ytDlpCookiesFromBrowser = (process.env.AUDIOGRABBER_YT_DLP_COOKIES_FROM_BROWSER ?? "").trim();
    }

    async submitDownload(request: DownloadRequest, onProgress?: WorkerProgressCallback): Promise<WorkerSubmission> {
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

        this.ensureRuntimeFolders();

        if (this.hasExistingDownload(videoId)) {
            if (Object.keys(metadata).length > 0 || outputFormat === "mp3") {
                await this.applyMetadataForId(videoId, metadata);
            }
            this.removeNonMediaArtifacts(videoId, this.downloadFolder);
            return {
                accepted: true,
                externalJobId: randomUUID(),
                message: `already-downloaded:${videoId}`,
            };
        }

        if (outputFormat === "mp3" && !resolvedFfmpegPath) {
            return { accepted: false, message: "missing-ffmpeg-binary-for-mp3" };
        }

        const workDir = path.join(this.tmpFolder, `${videoId}-${Date.now()}-${randomUUID().slice(0, 8)}`);
        mkdirSync(workDir, { recursive: true });
        const downloadArgs = this.buildDownloadArgs(videoId, outputFormat, embedMetadata, workDir);

        try {
            await this.runProcess(this.ytDlpBin, downloadArgs, {
                onStdoutLine: (line) => {
                    console.log(`[yt-dlp stdout] ${line}`);
                    const percent = this.parseYtDlpProgressPercent(line);
                    if (typeof percent === "number") {
                        onProgress?.({ percent, phase: "downloading" });
                    }
                },
                onStderrLine: (line) => {
                    console.log(`[yt-dlp stderr] ${line}`);
                    const percent = this.parseYtDlpProgressPercent(line);
                    if (typeof percent === "number") {
                        onProgress?.({ percent, phase: "downloading" });
                    }
                },
            });

            onProgress?.({ percent: 92, phase: "postprocessing" });

            if (outputFormat === "mp3" && !this.hasOutputForId(videoId, [".mp3"], workDir)) {
                throw new Error(`expected-mp3-output-missing:${videoId}`);
            }

            if (Object.keys(metadata).length > 0 || outputFormat === "mp3") {
                await this.applyMetadataForId(videoId, metadata, workDir);
            }

            const finalOutputPath = this.findPrimaryOutputPath(videoId, workDir);
            if (!finalOutputPath) {
                throw new Error(`downloaded-output-missing:${videoId}`);
            }

            const finalExtension = path.extname(finalOutputPath).toLowerCase();
            if (!this.finalExtensions.has(finalExtension)) {
                throw new Error(`unsupported-final-output:${finalExtension}`);
            }

            this.moveFileToFolder(finalOutputPath, this.downloadFolder);
            this.moveInfoJsonToFolder(videoId, workDir, this.downloadFolder);
            this.removeNonMediaArtifacts(videoId, workDir);
            rmSync(workDir, { recursive: true, force: true });

            onProgress?.({ percent: 98, phase: "postprocessing" });
        } catch (error) {
            const details = error instanceof Error ? error.message : "yt-dlp-download-failed";
            const authHint = details.includes("Sign in to confirm you\u2019re not a bot") || details.includes("Use --cookies-from-browser") || details.includes("Use --cookies for the authentication")
                ? ":set AUDIOGRABBER_YT_DLP_COOKIES_FILE or AUDIOGRABBER_YT_DLP_COOKIES_FROM_BROWSER"
                : "";
            this.logFailureAndCleanup({
                videoId,
                outputFormat,
                embedMetadata,
                workDir,
                error: `${details}${authHint}`,
            });
            return { accepted: false, message: `${details}${authHint}` };
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

        const virtualEnv = (process.env.VIRTUAL_ENV ?? "").trim();
        const appRoot = path.resolve(__dirname, "../../..");
        const workspaceRoot = path.resolve(appRoot, "../../..");

        const candidates = [
            virtualEnv ? path.join(virtualEnv, "bin/yt-dlp") : "",
            path.resolve(appRoot, ".venv/bin/yt-dlp"),
            path.resolve(process.cwd(), ".venv/bin/yt-dlp"),
            path.resolve(process.cwd(), "projects/audiograbber/apps/server/.venv/bin/yt-dlp"),
            path.resolve(workspaceRoot, "projects/audiograbber/apps/server/.venv/bin/yt-dlp"),
            path.resolve(process.cwd(), "projects/ytdownloader/apps/AudioGrabber/.venv/bin/yt-dlp"),
            "yt-dlp",
        ].filter(Boolean);

        for (const candidate of candidates) {
            if (!candidate.includes(path.sep) || existsSync(candidate)) {
                return candidate;
            }
        }

        return "yt-dlp";
    }

    private resolveDownloadFolder(): string {
        return AUDIOGRABBER_DOWNLOAD_FOLDER;
    }

    private resolveTmpFolder(): string {
        return AUDIOGRABBER_DOWNLOAD_TMP_FOLDER;
    }

    private resolveFailedFolder(): string {
        return AUDIOGRABBER_DOWNLOAD_FAILED_FOLDER;
    }

    private resolveFailureLogPath(): string {
        const configured = (process.env.AUDIOGRABBER_WORKER_FAILURE_LOG ?? "").trim();
        if (configured.length > 0) {
            return configured;
        }

        return path.join(this.failedFolder, "download-failures.jsonl");
    }

    private ensureRuntimeFolders(): void {
        mkdirSync(this.downloadFolder, { recursive: true });
        mkdirSync(this.tmpFolder, { recursive: true });
        mkdirSync(path.dirname(this.failureLogPath), { recursive: true });
    }

    private buildDownloadArgs(videoId: string, outputFormat: string, embedMetadata: boolean, outputFolder: string): string[] {
        const ffmpegLocation = resolvedFfmpegPath ? path.dirname(resolvedFfmpegPath) : undefined;
        const retries = Math.max(1, Number(process.env.AUDIOGRABBER_YT_DLP_RETRIES ?? 8));
        const fragmentRetries = Math.max(1, Number(process.env.AUDIOGRABBER_YT_DLP_FRAGMENT_RETRIES ?? 8));
        const retrySleep = (process.env.AUDIOGRABBER_YT_DLP_RETRY_SLEEP ?? "exp=1:20").trim();
        const sleepInterval = (process.env.AUDIOGRABBER_YT_DLP_SLEEP_INTERVAL ?? "").trim();
        const maxSleepInterval = (process.env.AUDIOGRABBER_YT_DLP_MAX_SLEEP_INTERVAL ?? "").trim();
        const socketTimeout = Number(process.env.AUDIOGRABBER_YT_DLP_SOCKET_TIMEOUT ?? 30);
        const downloadArgs = [
            "--newline",
            "--progress",
            "--no-playlist",
            "--socket-timeout",
            String(socketTimeout),
            "--retries",
            String(retries),
            "--fragment-retries",
            String(fragmentRetries),
            "--retry-sleep",
            retrySleep,
            "--concurrent-fragments",
            "1",
            "--write-info-json",
            "--write-thumbnail",
            "--convert-thumbnails",
            "jpg",
            "--output",
            path.join(outputFolder, "%(title)s %(id)s.%(ext)s"),
            "--format",
            "bestaudio/best",
        ];

        if (ffmpegLocation) {
            downloadArgs.push("--ffmpeg-location", ffmpegLocation);
        }
        if (sleepInterval.length > 0) {
            downloadArgs.push("--sleep-interval", sleepInterval);
        }
        if (maxSleepInterval.length > 0) {
            downloadArgs.push("--max-sleep-interval", maxSleepInterval);
        }
        this.appendYtDlpAuthArgs(downloadArgs);
        if (embedMetadata) {
            downloadArgs.push("--add-metadata");
        }
        if (outputFormat === "mp3") {
            downloadArgs.push("--extract-audio", "--audio-format", "mp3", "--audio-quality", "192K");
        }

        downloadArgs.push(`https://www.youtube.com/watch?v=${videoId}`);
        return downloadArgs;
    }

    private appendYtDlpAuthArgs(downloadArgs: string[]): void {
        if (this.ytDlpCookiesPath.length > 0) {
            downloadArgs.push("--cookies", this.ytDlpCookiesPath);
            return;
        }

        if (this.ytDlpCookiesFromBrowser.length > 0) {
            downloadArgs.push("--cookies-from-browser", this.ytDlpCookiesFromBrowser);
        }
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
            .some((fileName) => this.finalExtensions.has(path.extname(fileName).toLowerCase()) && fileName.includes(videoId));
    }

    private hasOutputForId(videoId: string, extensions: string[], folder: string = this.downloadFolder): boolean {
        if (!existsSync(folder)) {
            return false;
        }

        const normalized = new Set(extensions.map((ext) => ext.toLowerCase()));
        return readdirSync(folder)
            .some((fileName) => fileName.includes(videoId) && normalized.has(path.extname(fileName).toLowerCase()));
    }

    private findOutputPaths(videoId: string, folder: string = this.downloadFolder): string[] {
        if (!existsSync(folder)) {
            return [];
        }

        return readdirSync(folder)
            .filter((fileName) => fileName.includes(videoId))
            .filter((fileName) => !fileName.endsWith(".part") && !fileName.endsWith(".ytdl") && this.libraryExtensions.has(path.extname(fileName).toLowerCase()))
            .map((fileName) => path.join(folder, fileName));
    }

    private async applyMetadataForId(videoId: string, metadata: MetadataFields, folder: string = this.downloadFolder): Promise<void> {
        const paths = this.findOutputPaths(videoId, folder);
        const coverArtPath = this.findThumbnailPath(videoId, folder);
        for (const outputPath of paths) {
            try {
                await this.applyMetadataToFile(outputPath, metadata, coverArtPath);
            } catch (error) {
                const details = error instanceof Error ? error.message : String(error);
                console.error(`failed to apply metadata on ${outputPath}: ${details}`);
            }
        }
    }

    private async applyMetadataToFile(filePath: string, metadata: MetadataFields, coverArtPath?: string): Promise<void> {
        const title = metadata.title?.trim();
        const artist = metadata.artist?.trim();
        const album = metadata.album?.trim();

        if (!title && !artist && !album && !coverArtPath) {
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
            if (coverArtPath) {
                tags.image = {
                    imageBuffer: readFileSync(coverArtPath),
                    mime: this.inferImageMimeType(coverArtPath),
                    type: {
                        id: 3,
                        name: "front cover",
                    },
                    description: "Cover",
                };
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

    private findThumbnailPath(videoId: string, folder: string = this.downloadFolder): string | undefined {
        if (!existsSync(folder)) {
            return undefined;
        }

        const thumbnailExt = new Set([".jpg", ".jpeg", ".png"]);
        const matched = readdirSync(folder)
            .filter((fileName) => fileName.includes(videoId))
            .filter((fileName) => thumbnailExt.has(path.extname(fileName).toLowerCase()))
            .sort((a, b) => a.localeCompare(b));

        if (matched.length === 0) {
            return undefined;
        }

        return path.join(folder, matched[0]);
    }

    private findPrimaryOutputPath(videoId: string, folder: string): string | undefined {
        if (!existsSync(folder)) {
            return undefined;
        }

        const candidates = readdirSync(folder)
            .filter((fileName) => fileName.includes(videoId))
            .filter((fileName) => this.libraryExtensions.has(path.extname(fileName).toLowerCase()))
            .sort((a, b) => a.localeCompare(b));

        if (candidates.length === 0) {
            return undefined;
        }

        const preferred = candidates.find((fileName) => this.finalExtensions.has(path.extname(fileName).toLowerCase()));
        const selected = preferred ?? candidates[0];
        return path.join(folder, selected);
    }

    private moveFileToFolder(sourcePath: string, targetFolder: string): string {
        mkdirSync(targetFolder, { recursive: true });
        const fileName = path.basename(sourcePath);
        const targetPath = path.join(targetFolder, fileName);
        rmSync(targetPath, { force: true });
        renameSync(sourcePath, targetPath);
        return targetPath;
    }

    private moveInfoJsonToFolder(videoId: string, sourceFolder: string, targetFolder: string): void {
        if (!existsSync(sourceFolder)) {
            return;
        }

        const infoFiles = readdirSync(sourceFolder)
            .filter((fileName) => fileName.includes(videoId) && fileName.endsWith(".info.json"))
            .sort((a, b) => a.localeCompare(b));

        if (infoFiles.length === 0) {
            return;
        }

        const selected = infoFiles[0];
        this.moveFileToFolder(path.join(sourceFolder, selected), targetFolder);
    }

    private removeNonMediaArtifacts(videoId: string, folder: string): void {
        if (!existsSync(folder)) {
            return;
        }

        const files = readdirSync(folder)
            .filter((fileName) => fileName.includes(videoId))
            .filter((fileName) => !this.finalExtensions.has(path.extname(fileName).toLowerCase()));

        for (const fileName of files) {
            const fullPath = path.join(folder, fileName);
            rmSync(fullPath, { force: true, recursive: true });
        }
    }

    private logFailureAndCleanup(details: {
        videoId: string;
        outputFormat: string;
        embedMetadata: boolean;
        workDir: string;
        error: string;
    }): void {
        const tempFiles = this.listWorkDirFiles(details.workDir);
        const entry = {
            timestamp: new Date().toISOString(),
            videoId: details.videoId,
            outputFormat: details.outputFormat,
            embedMetadata: details.embedMetadata,
            workDir: details.workDir,
            files: tempFiles,
            error: details.error,
        };

        try {
            appendFileSync(this.failureLogPath, `${JSON.stringify(entry)}\n`, "utf8");
        } catch (writeError) {
            const writeDetails = writeError instanceof Error ? writeError.message : String(writeError);
            console.error(`failed to write download failure log: ${writeDetails}`);
        }

        this.cleanupWorkDir(details.workDir);
    }

    private listWorkDirFiles(workDir: string): Array<{ name: string; sizeBytes: number; modifiedAt: string }> {
        if (!existsSync(workDir)) {
            return [];
        }

        return readdirSync(workDir)
            .map((name) => {
                const fullPath = path.join(workDir, name);
                const stats = statSync(fullPath);
                return {
                    name,
                    sizeBytes: stats.size,
                    modifiedAt: stats.mtime.toISOString(),
                };
            });
    }

    private cleanupWorkDir(workDir: string): void {
        if (!existsSync(workDir)) {
            return;
        }

        try {
            rmSync(workDir, { recursive: true, force: true });
        } catch {
            rmSync(workDir, { recursive: true, force: true });
        }
    }

    private inferImageMimeType(filePath: string): string {
        const extension = path.extname(filePath).toLowerCase();
        if (extension === ".png") {
            return "image/png";
        }
        return "image/jpeg";
    }

    private parseYtDlpProgressPercent(line: string): number | undefined {
        const match = line.match(/\[download\]\s+([0-9]+(?:\.[0-9]+)?)%/i);
        if (!match) {
            return undefined;
        }

        const value = Number(match[1]);
        if (!Number.isFinite(value)) {
            return undefined;
        }

        return Math.max(0, Math.min(100, value));
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

    private runProcess(command: string, args: string[], options?: RunProcessOptions): Promise<{ stdout: string; stderr: string }> {
        return new Promise((resolve, reject) => {
            const processHandle = spawn(command, args, {
                stdio: ["ignore", "pipe", "pipe"],
            });

            let stdout = "";
            let stderr = "";
            let stderrLineBuffer = "";
            let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

            const clearWatchdog = (): void => {
                if (timeoutHandle) {
                    clearTimeout(timeoutHandle);
                    timeoutHandle = undefined;
                }
            };

            const resetWatchdog = (): void => {
                clearWatchdog();
                timeoutHandle = setTimeout(() => {
                    processHandle.kill();
                    reject(new Error(`worker-timeout-${this.timeoutMs}ms`));
                }, this.timeoutMs);
            };

            const flushStderrLines = (): void => {
                const lines = stderrLineBuffer.split(/\r?\n/);
                stderrLineBuffer = lines.pop() ?? "";
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.length > 0) {
                        options?.onStderrLine?.(trimmed);
                    }
                }
            };

            resetWatchdog();

            let stdoutLineBuffer = "";
            const flushStdoutLines = (): void => {
                const lines = stdoutLineBuffer.split(/\r?\n/);
                stdoutLineBuffer = lines.pop() ?? "";
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.length > 0) {
                        options?.onStdoutLine?.(trimmed);
                    }
                }
            };

            processHandle.stdout.on("data", (chunk: Buffer) => {
                const text = chunk.toString();
                stdout += text;
                stdoutLineBuffer += text;
                flushStdoutLines();
                resetWatchdog();
            });

            processHandle.stderr.on("data", (chunk: Buffer) => {
                const text = chunk.toString();
                stderr += text;
                stderrLineBuffer += text;
                flushStderrLines();
                resetWatchdog();
            });

            processHandle.on("error", (error: Error) => {
                clearWatchdog();
                reject(error);
            });

            processHandle.on("close", (code: number | null) => {
                clearWatchdog();
                if (stdoutLineBuffer.trim().length > 0) {
                    options?.onStdoutLine?.(stdoutLineBuffer.trim());
                }
                if (stderrLineBuffer.trim().length > 0) {
                    options?.onStderrLine?.(stderrLineBuffer.trim());
                }
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
