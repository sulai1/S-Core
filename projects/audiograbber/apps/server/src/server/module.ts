import { OpenApiModule } from "@s-core/core";
import { DataSource } from "typeorm";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { paths } from "./api/index.js";
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

    const normalized = channelRef.startsWith("@") ? channelRef.slice(1) : channelRef;
    if (!normalized) {
        return null;
    }

    const searchResult = await youtubeGet<{ snippet?: { channelId?: string } }>("search", {
        key: apiKey,
        part: "snippet",
        type: "channel",
        q: normalized,
        maxResults: "1",
    });

    return searchResult.items?.[0]?.snippet?.channelId ?? null;
}

export function createAudioGrabberModule(dataSource: DataSource): OpenApiModule<paths> {
    const worker = new YtDlpWorkerAdapter();
    const jobService = new JobService(worker, dataSource);

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
            post: async (request) => {
                const job = await jobService.queueDownload(request);
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
            post: async (_request, options) => {
                const channelId = (options as any)?.channelId as string | undefined ?? "unknown";
                const job = await jobService.queueSync({
                    channelId,
                });
                return {
                    jobId: job.jobId,
                    channelId,
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
                    return await jobService.listVideos(undefined, undefined, "all");
                }

                const queryLimit = (options as any).limit as string | number | undefined;
                const queryKeyword = (options as any).keyword as string | undefined;
                const queryMediaType = (options as any).mediaType as "all" | "audio" | "video" | undefined;

                console.log("[library/videos] Query params:", { limit: queryLimit, keyword: queryKeyword, mediaType: queryMediaType });

                const parsedLimit = Number(queryLimit);
                const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : undefined;
                const mediaType = queryMediaType === "audio" || queryMediaType === "video" ? queryMediaType : "all";

                return await jobService.listVideos(limit, queryKeyword, mediaType);
            },
        },
    };
}
