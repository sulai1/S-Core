import { OpenApiModule } from "@s-core/core";
import { DataSource } from "typeorm";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { paths } from "./api/index.js";
import type { AuthContext } from "./auth.js";
import { JobService } from "./services/JobService.js";
import { YtDlpWorkerAdapter } from "./worker/PythonWorkerAdapter.js";

type YoutubeApiListResponse<T> = {
    items?: T[];
    nextPageToken?: string;
    error?: {
        message?: string;
    };
};

const youtubeBaseUrl = (process.env.AUDIOGRABBER_YT_URL ?? "https://youtube.googleapis.com/youtube/v3/").replace(/\/+$/, "");
const youtubeRequestTimeoutMs = Number(process.env.AUDIOGRABBER_YT_TIMEOUT_MS ?? 15000);
const youtubeRequestRetries = Number(process.env.AUDIOGRABBER_YT_RETRIES ?? 1);

const execFileAsync = promisify(execFile);

async function getYtDlpVersion(ytDlpBin: string): Promise<string> {
    try {
        const { stdout } = await execFileAsync(ytDlpBin, ["--version"], { timeout: 10000 });
        return stdout.trim();
    } catch {
        return "unknown";
    }
}

async function getLatestYtDlpVersion(): Promise<string> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
            const response = await fetch("https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest", {
                headers: { "User-Agent": "audiograbber-server" },
                signal: controller.signal,
            });
            if (!response.ok) {
                return "unknown";
            }
            const data = await response.json() as { tag_name?: string };
            return (data.tag_name ?? "unknown").replace(/^v/, "");
        } finally {
            clearTimeout(timeout);
        }
    } catch {
        return "unknown";
    }
}

async function updateYtDlp(ytDlpBin: string): Promise<void> {
    // Derive pip from the same environment as yt-dlp.
    // If ytDlpBin is an absolute path (e.g. /path/.venv/bin/yt-dlp), use the
    // sibling pip. Otherwise fall back to "pip".
    let pipBin = "pip";
    if (ytDlpBin.includes("/")) {
        const siblingPip = path.join(path.dirname(ytDlpBin), "pip");
        if (existsSync(siblingPip)) {
            pipBin = siblingPip;
        } else {
            const siblingPip3 = path.join(path.dirname(ytDlpBin), "pip3");
            if (existsSync(siblingPip3)) {
                pipBin = siblingPip3;
            }
        }
    }

    try {
        console.log(`[yt-dlp update] Running: ${pipBin} install -U yt-dlp`);
        const { stdout, stderr } = await execFileAsync(pipBin, ["install", "-U", "yt-dlp"], { timeout: 120000 });
        if (stdout.trim()) {
            console.log("[yt-dlp update]", stdout.trim());
        }
        if (stderr.trim()) {
            console.log("[yt-dlp update stderr]", stderr.trim());
        }
    } catch (err) {
        console.error("[yt-dlp update failed]", err instanceof Error ? err.message : String(err));
    }
}

function getApiKey(): string {
    return (process.env.AUDIOGRABBER_YT_API_KEY ?? "").trim();
}

async function youtubeGet<T>(resource: string, params: Record<string, string>): Promise<YoutubeApiListResponse<T>> {
    const query = new URLSearchParams(params);
    const url = `${youtubeBaseUrl}/${resource}?${query.toString()}`;
    let lastError: unknown;

    for (let attempt = 0; attempt <= youtubeRequestRetries; attempt += 1) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), youtubeRequestTimeoutMs);

        try {
            const response = await fetch(url, { signal: controller.signal });
            const data = await response.json() as YoutubeApiListResponse<T>;

            if (!response.ok) {
                const message = data?.error?.message ?? `youtube-api-http-${response.status}`;
                throw {
                    status: 502,
                    error: "YouTube API request failed",
                    details: message,
                };
            }

            return data;
        } catch (error) {
            lastError = error;

            if ((error as { status?: unknown })?.status) {
                throw error;
            }

            if (attempt >= youtubeRequestRetries) {
                const details = error instanceof Error ? error.message : "fetch failed";
                throw {
                    status: 502,
                    error: "YouTube API request failed",
                    details,
                };
            }
        } finally {
            clearTimeout(timeout);
        }
    }

    const details = lastError instanceof Error ? lastError.message : "fetch failed";
    throw {
        status: 502,
        error: "YouTube API request failed",
        details,
    };
}

async function resolveChannelId(channelRef: string, apiKey: string): Promise<string | null> {
    if (/^UC[\w-]{20,}$/.test(channelRef)) {
        return channelRef;
    }

    const handle = channelRef.startsWith("@") ? channelRef : `@${channelRef}`;

    const result = await youtubeGet<{ id?: string }>("channels", {
        key: apiKey,
        part: "id",
        forHandle: handle,
        maxResults: "1",
    });

    return result.items?.[0]?.id ?? null;
}

export function createAudioGrabberModule(dataSource: DataSource): OpenApiModule<paths> {
    const worker = new YtDlpWorkerAdapter();
    const jobService = new JobService(worker, dataSource);
    const schedulerIntervalMsRaw = Number(process.env.AUDIOGRABBER_SYNC_SCHEDULER_INTERVAL_MS ?? 60000);
    const schedulerIntervalMs = Number.isFinite(schedulerIntervalMsRaw) && schedulerIntervalMsRaw >= 10000
        ? schedulerIntervalMsRaw
        : 60000;

    const schedulerHandle = setInterval(() => {
        void jobService.runDueSyncSchedules().catch((error: unknown) => {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`[sync-scheduler] execution failed: ${message}`);
        });
    }, schedulerIntervalMs);

    return {
        "/health": {
            get: async () => ({ status: "ok" }),
        },
        "/system/info": {
            get: async () => {
                const ytDlpBin = (process.env.AUDIOGRABBER_YT_DLP_BIN ?? "yt-dlp").trim() || "yt-dlp";
                const [version, latestVersion] = await Promise.all([
                    getYtDlpVersion(ytDlpBin),
                    getLatestYtDlpVersion(),
                ]);
                const isOutdated = version !== "unknown" && latestVersion !== "unknown" && version !== latestVersion;
                if (isOutdated) {
                    console.log(`[yt-dlp] Outdated (${version} → ${latestVersion}), updating…`);
                    await updateYtDlp(ytDlpBin);
                    const updatedVersion = await getYtDlpVersion(ytDlpBin);
                    console.log(`[yt-dlp] Updated to ${updatedVersion}`);
                    return {
                        ytDlp: {
                            version: updatedVersion,
                            latestVersion,
                            upToDate: updatedVersion === latestVersion,
                        },
                    };
                }
                return {
                    ytDlp: {
                        version,
                        latestVersion,
                        upToDate: !isOutdated && version !== "unknown",
                    },
                };
            },
        },
        "/jobs/download": {
            post: async (request, options) => {
                const authContext = (options as { authContext?: AuthContext } | undefined)?.authContext;
                const job = await jobService.queueDownload(request, authContext?.userId);
                return { jobId: job.jobId, state: "queued" as const };
            },
        },
        "/jobs/{jobId}": {
            get: async (options) => {
                const jobId = (options as any)?.jobId as string | undefined ?? "";
                const job = await jobService.getJob(jobId);
                if (!job) {
                    throw {
                        status: 404,
                        error: "Job not found",
                        details: `Job ${jobId} not found`,
                    };
                }
                return {
                    jobId: job.jobId,
                    state: job.state,
                    progress: job.progress,
                    error: job.error,
                };
            },
        },
        "/sync/channels/{channelId}": {
            post: async (request, options) => {
                const channelRef = ((options as any)?.channelId as string | undefined ?? "").trim();
                const authContext = (options as { authContext?: AuthContext } | undefined)?.authContext;
                if (!channelRef) {
                    throw {
                        status: 400,
                        error: "Invalid channel",
                        details: "A channel ID or @handle is required.",
                    };
                }

                const apiKey = getApiKey();
                if (!apiKey) {
                    throw {
                        status: 400,
                        error: "Missing API key",
                        details: "AUDIOGRABBER_YT_API_KEY is required for channel sync.",
                    };
                }

                const resolvedChannelId = await resolveChannelId(channelRef, apiKey);
                if (!resolvedChannelId) {
                    throw {
                        status: 404,
                        error: "Channel not found",
                        details: `Could not resolve channel '${channelRef}'.`,
                    };
                }

                const rawInterval = (request as { interval?: string } | undefined)?.interval;
                const interval = rawInterval === "daily" || rawInterval === "weekly" || rawInterval === "immediate"
                    ? rawInterval
                    : "immediate";

                const parsedMaxResults = Number((request as { maxResults?: number } | undefined)?.maxResults);
                const maxResults = Number.isFinite(parsedMaxResults) && parsedMaxResults > 0
                    ? Math.min(1000, Math.max(1, Math.round(parsedMaxResults)))
                    : undefined;

                const parsedMaxDurationSeconds = Number((request as { maxDurationSeconds?: number } | undefined)?.maxDurationSeconds);
                const maxDurationSeconds = Number.isFinite(parsedMaxDurationSeconds) && parsedMaxDurationSeconds > 0
                    ? Math.round(parsedMaxDurationSeconds)
                    : undefined;

                const parsedMinDurationSeconds = Number((request as { minDurationSeconds?: number } | undefined)?.minDurationSeconds);
                const minDurationSeconds = Number.isFinite(parsedMinDurationSeconds) && parsedMinDurationSeconds > 0
                    ? Math.round(parsedMinDurationSeconds)
                    : undefined;

                if (typeof minDurationSeconds === "number" && typeof maxDurationSeconds === "number" && minDurationSeconds > maxDurationSeconds) {
                    throw {
                        status: 400,
                        error: "Invalid duration range",
                        details: "minDurationSeconds must be less than or equal to maxDurationSeconds.",
                    };
                }

                if (interval === "daily" || interval === "weekly") {
                    const schedule = await jobService.scheduleSync({
                        channelId: resolvedChannelId,
                        maxResults,
                        minDurationSeconds,
                        maxDurationSeconds,
                        interval,
                    }, authContext?.userId);

                    return {
                        jobId: schedule.id,
                        channelId: resolvedChannelId,
                        scheduleId: schedule.id,
                        nextRunAt: schedule.nextRunAt.toISOString(),
                        state: "scheduled" as const,
                    };
                }

                const job = await jobService.queueSync({
                    channelId: resolvedChannelId,
                    maxResults,
                    minDurationSeconds,
                    maxDurationSeconds,
                    interval,
                }, authContext?.userId);
                return {
                    jobId: job.jobId,
                    channelId: resolvedChannelId,
                    state: "queued" as const,
                };
            },
        },
        "/sync/schedules": {
            get: async (options) => {
                const authContext = (options as { authContext?: AuthContext } | undefined)?.authContext;
                const items = await jobService.listSyncSchedules(authContext?.userId);
                return { items };
            },
        },
        "/sync/schedules/{scheduleId}/run": {
            post: async (_request, options) => {
                const scheduleId = ((options as any)?.scheduleId as string | undefined ?? "").trim();
                const authContext = (options as { authContext?: AuthContext } | undefined)?.authContext;
                if (!scheduleId) {
                    throw {
                        status: 400,
                        error: "Invalid schedule",
                        details: "A scheduleId path parameter is required.",
                    };
                }

                const job = await jobService.runScheduleNow(scheduleId, authContext?.userId);
                if (!job) {
                    throw {
                        status: 404,
                        error: "Schedule not found",
                        details: `Schedule ${scheduleId} not found`,
                    };
                }

                return {
                    scheduleId,
                    jobId: job.jobId,
                    state: "queued" as const,
                };
            },
        },
        "/channels/overview": {
            get: async (options) => {
                if (!options) {
                    throw {
                        status: 400,
                        error: "Invalid request",
                        details: "Request options are missing",
                    };
                }
                const queryChannel = (options as any).channel as string | undefined;
                const queryChannelId = (options as any).channelId as string | undefined;
                const queryHandle = (options as any).handle as string | undefined;
                const queryMaxResults = (options as any).maxResults as string | number | undefined;

                console.log("[channels/overview] Query params:", { channel: queryChannel, channelId: queryChannelId, handle: queryHandle, maxResults: queryMaxResults });

                const channelRef = (queryChannel ?? queryChannelId ?? queryHandle ?? "").toString().trim();
                const parsedMaxResults = Number(queryMaxResults);
                const maxResults = Number.isFinite(parsedMaxResults)
                    ? Math.min(200, Math.max(1, parsedMaxResults))
                    : 100;

                if (!channelRef) {
                    throw {
                        status: 400,
                        error: "Invalid channel",
                        details: "At least one of 'channel', 'channelId', or 'handle' query parameter is required.",
                    };
                }

                const apiKey = getApiKey();
                if (!apiKey) {
                    throw {
                        status: 400,
                        error: "Missing API key",
                        details: "AUDIOGRABBER_YT_API_KEY is required for channel overview.",
                    };
                }

                const resolvedChannelId = await resolveChannelId(channelRef, apiKey);
                if (!resolvedChannelId) {
                    throw {
                        status: 404,
                        error: "Channel not found",
                        details: `Could not resolve channel '${channelRef}'.`,
                    };
                }

                const channelInfo = await youtubeGet<{
                    id?: string;
                    snippet?: { title?: string; description?: string; customUrl?: string };
                    contentDetails?: { relatedPlaylists?: { uploads?: string } };
                    statistics?: { videoCount?: string };
                }>("channels", {
                    key: apiKey,
                    part: "snippet,contentDetails,statistics",
                    id: resolvedChannelId,
                    maxResults: "1",
                });

                const channelData = channelInfo.items?.[0];
                const uploadsPlaylistId = channelData?.contentDetails?.relatedPlaylists?.uploads;
                if (!channelData || !uploadsPlaylistId) {
                    throw {
                        status: 404,
                        error: "Channel not found",
                        details: `Channel '${channelRef}' does not have an uploads playlist.`,
                    };
                }

                const videos: Array<{
                    videoId: string;
                    title: string;
                    publishedAt: string;
                    thumbnailUrl?: string;
                    duration?: string;
                    viewCount?: number;
                    likeCount?: number;
                    description?: string;
                    tags?: string[];
                }> = [];
                let nextPageToken: string | undefined;

                while (videos.length < maxResults) {
                    const perPage = Math.min(50, maxResults - videos.length);
                    const playlistResult = await youtubeGet<{
                        snippet?: {
                            publishedAt?: string;
                            title?: string;
                            description?: string;
                            thumbnails?: {
                                medium?: { url?: string };
                                default?: { url?: string };
                            };
                            resourceId?: { videoId?: string };
                        };
                    }>("playlistItems", {
                        key: apiKey,
                        part: "snippet",
                        playlistId: uploadsPlaylistId,
                        maxResults: String(perPage),
                        ...(nextPageToken ? { pageToken: nextPageToken } : {}),
                    });

                    const pageItems = playlistResult.items ?? [];
                    const videoIds = pageItems.map(item => item.snippet?.resourceId?.videoId).filter(Boolean) as string[];

                    // Batch fetch full video details
                    if (videoIds.length > 0) {
                        const videoDetails = await youtubeGet<{
                            id?: string;
                            snippet?: { title?: string; description?: string; tags?: string[] };
                            contentDetails?: { duration?: string };
                            statistics?: { viewCount?: string; likeCount?: string };
                        }>("videos", {
                            key: apiKey,
                            part: "snippet,contentDetails,statistics",
                            id: videoIds.join(","),
                            maxResults: String(videoIds.length),
                        });

                        const videoMetadataMap = new Map(
                            (videoDetails.items ?? []).map(item => [item.id, item])
                        );

                        for (const item of pageItems) {
                            const videoId = item.snippet?.resourceId?.videoId;
                            if (!videoId) {
                                continue;
                            }

                            const metadata = videoMetadataMap.get(videoId);
                            const resolvedTitle = metadata?.snippet?.title ?? item.snippet?.title ?? videoId;
                            const description = metadata?.snippet?.description;

                            videos.push({
                                videoId,
                                title: resolvedTitle,
                                publishedAt: item.snippet?.publishedAt ?? new Date(0).toISOString(),
                                thumbnailUrl: item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url,
                                duration: metadata?.contentDetails?.duration,
                                viewCount: metadata?.statistics?.viewCount ? Number(metadata.statistics.viewCount) : undefined,
                                likeCount: metadata?.statistics?.likeCount ? Number(metadata.statistics.likeCount) : undefined,
                                description,
                                tags: metadata?.snippet?.tags,
                            });
                        }
                    }

                    nextPageToken = playlistResult.nextPageToken;
                    if (!nextPageToken || pageItems.length === 0) {
                        break;
                    }
                }

                return {
                    channel: {
                        id: channelData.id ?? resolvedChannelId,
                        title: channelData.snippet?.title ?? resolvedChannelId,
                        description: channelData.snippet?.description,
                        customUrl: channelData.snippet?.customUrl,
                        videoCount: Number(channelData.statistics?.videoCount ?? 0),
                    },
                    videos,
                };
            },
        },
        "/library/videos": {
            get: async (options) => {
                if (!options) {
                    return await jobService.listVideos(undefined, undefined, "all", [], "all");
                }

                const queryLimit = (options as any).limit as string | number | undefined;
                const queryKeyword = (options as any).keyword as string | undefined;
                const queryMediaType = (options as any).mediaType as "all" | "audio" | "video" | undefined;
                const queryTags = (options as any).tags as string | string[] | undefined;
                const queryTagMode = (options as any).tagMode as "all" | "any" | undefined;

                console.log("[library/videos] Query params:", {
                    limit: queryLimit,
                    keyword: queryKeyword,
                    mediaType: queryMediaType,
                    tags: queryTags,
                    tagMode: queryTagMode,
                });

                const parsedLimit = Number(queryLimit);
                const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : undefined;
                const mediaType = queryMediaType === "audio" || queryMediaType === "video" ? queryMediaType : "all";
                const tags = Array.isArray(queryTags)
                    ? queryTags
                    : typeof queryTags === "string" && queryTags.trim().length > 0
                        ? [queryTags]
                        : [];
                const tagMode = queryTagMode === "any" ? "any" : "all";

                return await jobService.listVideos(limit, queryKeyword, mediaType, tags, tagMode);
            },
        },
        "/library/tags": {
            get: async () => await jobService.listTags(),
        },
    };
}
