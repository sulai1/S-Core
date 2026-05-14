import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import { DataSource, In, Repository } from "typeorm";
import { Artist, ArtistEntity } from "../../database/entities/artist.entity.js";
import { Album, AlbumEntity } from "../../database/entities/album.entity.js";
import { AlbumTag, AlbumTagEntity } from "../../database/entities/album-tag.entity.js";
import { JobRepository } from "../../database/repositories/job.repository.js";
import { DbJob } from "../../database/entities/job.entity.js";
import { AudioFingerprint, AudioFingerprintEntity } from "../../database/entities/audio-fingerprint.entity.js";
import { MediaFile, MediaFileEntity } from "../../database/entities/media-file.entity.js";
import { MediaTag, MediaTagEntity } from "../../database/entities/media-tag.entity.js";
import { Tag, TagEntity } from "../../database/entities/tag.entity.js";
import { DownloadRequest, JobRecord, LibraryTagUsage, LibraryVideo, SyncRequest, TagSearchMode } from "../types.js";
import { splitArtistNames, uniqueArtistNames } from "../artistNames.js";
import { parseAlbumMetadata } from "../albumMetadata.js";
import { normalizeAlbumName, uniqueAlbumNames } from "../albumNames.js";
import { parseMusicMetadata } from "../musicMetadata.js";
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
    private readonly artistRepo: Repository<Artist>;
    private readonly albumRepo: Repository<Album>;
    private readonly albumTagRepo: Repository<AlbumTag>;
    private readonly fingerprintRepo: Repository<AudioFingerprint>;
    private readonly tagRepo: Repository<Tag>;
    private readonly mediaTagRepo: Repository<MediaTag>;
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
        this.artistRepo = dataSource.getRepository(ArtistEntity);
        this.albumRepo = dataSource.getRepository(AlbumEntity);
        this.albumTagRepo = dataSource.getRepository(AlbumTagEntity);
        this.fingerprintRepo = dataSource.getRepository(AudioFingerprintEntity);
        this.tagRepo = dataSource.getRepository(TagEntity);
        this.mediaTagRepo = dataSource.getRepository(MediaTagEntity);
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

    async listVideos(
        limit?: number,
        keyword?: string,
        mediaType: "all" | "audio" | "video" = "all",
        tags: string[] = [],
        tagMode: TagSearchMode = "all",
    ): Promise<{ items: LibraryVideo[] }> {
        if (!existsSync(this.downloadFolder)) {
            return { items: [] };
        }

        const normalizedKeyword = (keyword ?? "").trim().toLowerCase();
        const normalizedTagFilters = [...new Set(tags.map((value) => this.normalizeTagName(value)).filter(Boolean))];
        const items: LibraryVideo[] = readdirSync(this.downloadFolder)
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
                    artists: [] as string[],
                    albums: [] as string[],
                    tags: [] as string[],
                    year: null as number | null,
                    estimatedBpm: null as number | null,
                    estimatedKey: null as string | null,
                    thumbnailUrl: this.findThumbnailUrl(id),
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

        const videoIds = [...new Set(items.map((item) => item.id).filter((id) => /^[a-zA-Z0-9_-]{11}$/.test(id)))];
        let allowedMediaIds: Set<string> | undefined;
        if (videoIds.length > 0) {
            const mediaRows = await this.mediaRepo.find({
                where: {
                    youtubeVideoId: In(videoIds),
                },
                relations: {
                    artists: true,
                    albums: true,
                },
            });

            const mediaIds = mediaRows.map((row) => row.id);
            const tagsByMediaId = await this.getTagsByMediaId(mediaIds);

            if (normalizedTagFilters.length > 0) {
                allowedMediaIds = await this.filterMediaIdsByTags(mediaIds, normalizedTagFilters, tagMode);
            }

            const mediaByVideoId = new Map(mediaRows.map((row) => [row.youtubeVideoId, row]));

            const filtered: LibraryVideo[] = [];
            for (const item of items) {
                const media = mediaByVideoId.get(item.id);
                if (normalizedTagFilters.length > 0) {
                    if (!media || !allowedMediaIds?.has(media.id)) {
                        continue;
                    }
                }

                if (!media) {
                    filtered.push(item);
                    continue;
                }

                item.artists = media.artists?.map((artist) => artist.name) ?? [];
                item.albums = media.albums?.map((album) => album.name) ?? [];
                item.tags = tagsByMediaId.get(media.id) ?? [];
                item.year = media.year;
                item.estimatedBpm = media.estimatedBpm;
                item.estimatedKey = media.estimatedKey;
                filtered.push(item);
            }

            items.length = 0;
            items.push(...filtered);
        } else if (normalizedTagFilters.length > 0) {
            return { items: [] };
        }

        if (typeof limit === "number" && limit > 0) {
            return { items: items.slice(0, limit) };
        }

        return { items };
    }

    async listTags(): Promise<{ items: LibraryTagUsage[] }> {
        const rows = await this.mediaTagRepo.createQueryBuilder("mt")
            .innerJoin("tags", "tag", 'tag.id = mt."tagId"')
            .select("tag.name", "tag")
            .addSelect('COUNT(DISTINCT mt."mediaFileId")', "count")
            .groupBy("tag.id")
            .addGroupBy("tag.name")
            .orderBy('COUNT(DISTINCT mt."mediaFileId")', "DESC")
            .addOrderBy("tag.name", "ASC")
            .getRawMany<{ tag: string; count: string }>();

        return {
            items: rows.map((row) => ({
                tag: row.tag,
                count: Number.parseInt(row.count, 10) || 0,
            })),
        };
    }

    private findThumbnailUrl(videoId: string): string | undefined {
        if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
            return undefined;
        }

        return `/library/thumbnail/${encodeURIComponent(videoId)}`;
    }

    private async dispatchDownload(jobId: string, request: DownloadRequest): Promise<void> {
        await this.jobRepo.patch(jobId, { state: "running", progress: 15 });

        let lastProgress = 15;
        const result = await this.worker.submitDownload(request, (progressUpdate) => {
            const reported = typeof progressUpdate.percent === "number" ? progressUpdate.percent : 0;
            const normalized = Math.max(15, Math.min(90, Math.round(reported)));
            if (normalized <= lastProgress) {
                return;
            }

            lastProgress = normalized;
            void this.jobRepo.patch(jobId, { state: "running", progress: normalized });
        });

        if (!result.accepted) {
            throw new Error(result.message ?? "worker-rejected-download");
        }

        await this.jobRepo.patch(jobId, { state: "running", progress: Math.max(lastProgress, 95) });

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
        const infoTitle = typeof info?.title === "string" ? info.title.trim() : "";
        const infoDescription = typeof info?.description === "string" ? info.description : undefined;
        const parsedMusicMetadata = parseMusicMetadata(infoTitle || titleFromFile || output.baseName, infoDescription);
        const parsedAlbumMetadata = parseAlbumMetadata(infoDescription, typeof info?.upload_date === "string" ? info.upload_date : undefined);

        const title = (request.songTitle ?? "").trim()
            || (parsedMusicMetadata.songTitle ?? "").trim()
            || infoTitle
            || titleFromFile
            || output.baseName;
        const albumNames = uniqueAlbumNames([
            (request.album ?? "").trim(),
            typeof info?.album === "string" ? info.album.trim() : "",
            (parsedMusicMetadata.album ?? "").trim(),
            parsedAlbumMetadata.title ?? "",
        ]);
        const artistNames = uniqueArtistNames([
            ...splitArtistNames(request.artist),
            ...splitArtistNames(typeof info?.artist === "string" ? info.artist : undefined),
            ...splitArtistNames(parsedMusicMetadata.artist),
        ]);

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
                year,
                estimatedBpm,
                estimatedKey,
            });
            const updated = await this.mediaRepo.findOneByOrFail({ id: existing.id });
            await this.replaceMediaArtists(updated.id, artistNames);
            await this.replaceMediaAlbums(updated.id, albumNames, parsedAlbumMetadata);
            await this.replaceMediaTags(updated.id, tags);
            this.cleanupInfoJsonFiles(videoId);
            return updated;
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
            year,
            estimatedBpm,
            estimatedKey,
            createdAt: stats.birthtime,
        });
        const saved = await this.mediaRepo.save(entry);
        await this.replaceMediaArtists(saved.id, artistNames);
        await this.replaceMediaAlbums(saved.id, albumNames, parsedAlbumMetadata);
        await this.replaceMediaTags(saved.id, tags);
        this.cleanupInfoJsonFiles(videoId);
        return saved;
    }

    private async replaceMediaArtists(mediaFileId: string, rawArtistNames: string[]): Promise<void> {
        const normalizedToDisplay = new Map<string, string>();
        for (const rawArtistName of rawArtistNames) {
            const displayName = rawArtistName.trim();
            if (!displayName) {
                continue;
            }

            const normalizedName = displayName.toLowerCase().replace(/\s+/g, " ").trim();
            if (!normalizedName || normalizedToDisplay.has(normalizedName)) {
                continue;
            }

            normalizedToDisplay.set(normalizedName, displayName);
        }

        const relation = this.mediaRepo.createQueryBuilder().relation(MediaFileEntity, "artists").of(mediaFileId);
        const currentArtists = await relation.loadMany<Artist>();
        if (currentArtists.length > 0) {
            await relation.remove(currentArtists.map((artist) => artist.id));
        }

        if (normalizedToDisplay.size === 0) {
            return;
        }

        const values = [...normalizedToDisplay.values()].map((displayName) => ({
            name: displayName,
            normalizedName: displayName.toLowerCase().replace(/\s+/g, " ").trim(),
        }));

        await this.artistRepo.createQueryBuilder()
            .insert()
            .into(ArtistEntity)
            .values(values)
            .orIgnore()
            .execute();

        const normalizedNames = [...normalizedToDisplay.keys()];
        const artists = await this.artistRepo.find({
            where: {
                normalizedName: In(normalizedNames),
            },
        });

        if (artists.length === 0) {
            return;
        }

        await relation.add(artists.map((artist) => artist.id));
    }

    private async replaceMediaAlbums(
        mediaFileId: string,
        rawAlbumNames: string[],
        albumMetadata: ReturnType<typeof parseAlbumMetadata>,
    ): Promise<void> {
        const normalizedToDisplay = new Map<string, string>();
        for (const rawAlbumName of rawAlbumNames) {
            const displayName = rawAlbumName.trim();
            if (!displayName) {
                continue;
            }

            const normalizedName = normalizeAlbumName(displayName);
            if (!normalizedName || normalizedToDisplay.has(normalizedName)) {
                continue;
            }

            normalizedToDisplay.set(normalizedName, displayName);
        }

        const relation = this.mediaRepo.createQueryBuilder().relation(MediaFileEntity, "albums").of(mediaFileId);
        const currentAlbums = await relation.loadMany<Album>();
        if (currentAlbums.length > 0) {
            await relation.remove(currentAlbums.map((album) => album.id));
        }

        if (normalizedToDisplay.size === 0) {
            return;
        }

        const values = [...normalizedToDisplay.values()].map((displayName) => ({
            name: displayName,
            normalizedName: normalizeAlbumName(displayName),
            label: albumMetadata.label ?? null,
            catalogue: albumMetadata.catalogue ?? null,
            genre: albumMetadata.genre ?? null,
            style: albumMetadata.style ?? null,
            format: albumMetadata.format ?? null,
            releaseDate: albumMetadata.releaseDate ?? null,
        }));

        await this.albumRepo.createQueryBuilder()
            .insert()
            .into(AlbumEntity)
            .values(values)
            .orIgnore()
            .execute();

        const normalizedNames = [...normalizedToDisplay.keys()];
        const albums = await this.albumRepo.find({
            where: {
                normalizedName: In(normalizedNames),
            },
        });

        if (albums.length === 0) {
            return;
        }

        for (const album of albums) {
            const patch: Partial<Album> = {};
            if (!album.label && albumMetadata.label) patch.label = albumMetadata.label;
            if (!album.catalogue && albumMetadata.catalogue) patch.catalogue = albumMetadata.catalogue;
            if (!album.genre && albumMetadata.genre) patch.genre = albumMetadata.genre;
            if (!album.style && albumMetadata.style) patch.style = albumMetadata.style;
            if (!album.format && albumMetadata.format) patch.format = albumMetadata.format;
            if (!album.releaseDate && albumMetadata.releaseDate) patch.releaseDate = albumMetadata.releaseDate;

            if (Object.keys(patch).length > 0) {
                await this.albumRepo.update(album.id, patch);
            }
        }

        await relation.add(albums.map((album) => album.id));

        const albumTagNames = albumMetadata.tags;
        if (albumTagNames.length > 0) {
            await this.replaceAlbumTags(albums.map((album) => album.id), albumTagNames);
        }
    }

    private async replaceAlbumTags(albumIds: string[], rawTags: string[]): Promise<void> {
        const normalizedToDisplay = new Map<string, string>();
        for (const rawTag of rawTags) {
            const display = rawTag.trim();
            const normalized = this.normalizeTagName(display);
            if (!normalized || normalizedToDisplay.has(normalized)) {
                continue;
            }
            normalizedToDisplay.set(normalized, display);
        }

        if (normalizedToDisplay.size === 0 || albumIds.length === 0) {
            return;
        }

        await this.albumTagRepo.delete({
            albumId: In(albumIds),
        });

        const normalizedNames = [...normalizedToDisplay.keys()];
        await this.tagRepo.createQueryBuilder()
            .insert()
            .into(TagEntity)
            .values(normalizedNames.map((normalizedName) => ({
                name: normalizedToDisplay.get(normalizedName) ?? normalizedName,
                normalizedName,
            })))
            .orIgnore()
            .execute();

        const tagRows = await this.tagRepo.find({
            where: {
                normalizedName: In(normalizedNames),
            },
        });

        if (tagRows.length === 0) {
            return;
        }

        await this.albumTagRepo.createQueryBuilder()
            .insert()
            .into(AlbumTagEntity)
            .values(albumIds.flatMap((albumId) => tagRows.map((row) => ({ albumId, tagId: row.id }))))
            .orIgnore()
            .execute();
    }

    private normalizeTagName(value: string): string {
        return value.toLowerCase().replace(/\s+/g, " ").trim();
    }

    private async replaceMediaTags(mediaFileId: string, rawTags: string[]): Promise<void> {
        const normalizedToDisplay = new Map<string, string>();
        for (const rawTag of rawTags) {
            const display = rawTag.trim();
            const normalized = this.normalizeTagName(display);
            if (!normalized || normalizedToDisplay.has(normalized)) {
                continue;
            }
            normalizedToDisplay.set(normalized, display);
        }

        await this.mediaTagRepo.delete({ mediaFileId });
        if (normalizedToDisplay.size === 0) {
            return;
        }

        const normalizedNames = [...normalizedToDisplay.keys()];
        await this.tagRepo.createQueryBuilder()
            .insert()
            .into(TagEntity)
            .values(normalizedNames.map((normalizedName) => ({
                name: normalizedToDisplay.get(normalizedName) ?? normalizedName,
                normalizedName,
            })))
            .orIgnore()
            .execute();

        const tagRows = await this.tagRepo.find({
            where: {
                normalizedName: In(normalizedNames),
            },
        });

        if (tagRows.length === 0) {
            return;
        }

        await this.mediaTagRepo.createQueryBuilder()
            .insert()
            .into(MediaTagEntity)
            .values(tagRows.map((row) => ({ mediaFileId, tagId: row.id })))
            .orIgnore()
            .execute();
    }

    private async getTagsByMediaId(mediaIds: string[]): Promise<Map<string, string[]>> {
        const byMediaId = new Map<string, string[]>();
        if (mediaIds.length === 0) {
            return byMediaId;
        }

        const rows = await this.mediaTagRepo.createQueryBuilder("mt")
            .innerJoin("tags", "tag", 'tag.id = mt."tagId"')
            .select('mt."mediaFileId"', "mediaFileId")
            .addSelect("tag.name", "tagName")
            .where('mt."mediaFileId" IN (:...mediaIds)', { mediaIds })
            .orderBy("tag.name", "ASC")
            .getRawMany<{ mediaFileId: string; tagName: string }>();

        for (const row of rows) {
            const current = byMediaId.get(row.mediaFileId) ?? [];
            current.push(row.tagName);
            byMediaId.set(row.mediaFileId, current);
        }

        return byMediaId;
    }

    private async filterMediaIdsByTags(mediaIds: string[], normalizedTags: string[], mode: TagSearchMode): Promise<Set<string>> {
        if (mediaIds.length === 0 || normalizedTags.length === 0) {
            return new Set(mediaIds);
        }

        const query = this.mediaTagRepo.createQueryBuilder("mt")
            .innerJoin("tags", "tag", 'tag.id = mt."tagId"')
            .select('mt."mediaFileId"', "mediaFileId")
            .where('mt."mediaFileId" IN (:...mediaIds)', { mediaIds })
            .andWhere('tag."normalizedName" IN (:...normalizedTags)', { normalizedTags })
            .groupBy('mt."mediaFileId"');

        if (mode === "all") {
            query.having('COUNT(DISTINCT tag."normalizedName") = :requiredTagCount', {
                requiredTagCount: normalizedTags.length,
            });
        }

        const rows = await query.getRawMany<{ mediaFileId: string }>();
        return new Set(rows.map((row) => row.mediaFileId));
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

    private readInfoJson(videoId: string): { title?: string; artist?: string; album?: string; description?: string; tags?: unknown[]; duration?: number; release_year?: number; upload_date?: string; bpm?: number; key?: string; musical_key?: string } | undefined {
        const jsonFiles = this.getInfoJsonFiles(videoId);

        if (jsonFiles.length === 0) {
            return undefined;
        }

        try {
            const raw = readFileSync(jsonFiles[0].fullPath, "utf8");
            const parsed = JSON.parse(raw) as {
                title?: string;
                artist?: string;
                album?: string;
                description?: string;
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

    private cleanupInfoJsonFiles(videoId: string): void {
        const jsonFiles = this.getInfoJsonFiles(videoId);
        for (const file of jsonFiles) {
            try {
                unlinkSync(file.fullPath);
            } catch {
                // best effort cleanup for yt-dlp info sidecar files
            }
        }
    }

    private getInfoJsonFiles(videoId: string): Array<{ fullPath: string; modifiedAt: number }> {
        if (!existsSync(this.downloadFolder)) {
            return [];
        }

        return readdirSync(this.downloadFolder)
            .filter((fileName) => fileName.includes(videoId) && fileName.endsWith(".info.json"))
            .map((fileName) => {
                const fullPath = path.join(this.downloadFolder, fileName);
                return {
                    fullPath,
                    modifiedAt: statSync(fullPath).mtimeMs,
                };
            })
            .sort((a, b) => b.modifiedAt - a.modifiedAt);
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
