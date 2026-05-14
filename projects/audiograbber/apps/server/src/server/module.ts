import { OpenApiModule } from "@s-core/core";
import { DataSource } from "typeorm";
import { paths } from "./api/index.js";
import { JobService } from "./services/JobService.js";
import { YtDlpWorkerAdapter } from "./worker/PythonWorkerAdapter.js";
import { parseMusicMetadata } from "./musicMetadata.js";

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

async function fetchWatchPageMusicMetadata(videoId: string, videoTitle: string): Promise<{
    artist?: string;
    songTitle?: string;
    album?: string;
}> {
    try {
        const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&hl=en`;
        const response = await fetch(watchUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9",
            },
        });

        if (!response.ok) {
            return {};
        }

        const html = await response.text();
        return parseMusicMetadata(videoTitle, html);
    } catch {
        return {};
    }
}

export function createAudioGrabberModule(dataSource: DataSource): OpenApiModule<paths> {
    const jobService = new JobService(new YtDlpWorkerAdapter(), dataSource);

    return {
    "/health": {
        get: async () => ({ status: "ok" }),
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
                artist?: string;
                songTitle?: string;
                album?: string;
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
                        let musicMetadata = parseMusicMetadata(resolvedTitle, description);

                        if (!musicMetadata.artist || !musicMetadata.album || musicMetadata.songTitle === resolvedTitle) {
                            const watchPageMetadata = await fetchWatchPageMusicMetadata(videoId, resolvedTitle);
                            const shouldPreferWatchSongTitle = Boolean(
                                watchPageMetadata.songTitle
                                && (
                                    !musicMetadata.songTitle
                                    || musicMetadata.songTitle === resolvedTitle
                                    || watchPageMetadata.songTitle.length > musicMetadata.songTitle.length
                                )
                            );
                            const shouldPreferWatchArtist = Boolean(
                                watchPageMetadata.artist
                                && (
                                    !musicMetadata.artist
                                    || (
                                        musicMetadata.songTitle === resolvedTitle
                                        && !/[,&]/.test(musicMetadata.artist)
                                        && /[,&]/.test(watchPageMetadata.artist)
                                    )
                                )
                            );
                            musicMetadata = {
                                songTitle: shouldPreferWatchSongTitle
                                    ? watchPageMetadata.songTitle
                                    : (musicMetadata.songTitle ?? watchPageMetadata.songTitle),
                                artist: shouldPreferWatchArtist
                                    ? watchPageMetadata.artist
                                    : (musicMetadata.artist ?? watchPageMetadata.artist),
                                album: musicMetadata.album ?? watchPageMetadata.album,
                            };
                        }

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
                            ...musicMetadata,
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
                return jobService.listVideos(undefined, undefined, "all");
            }

            const queryLimit = (options as any).limit as string | number | undefined;
            const queryKeyword = (options as any).keyword as string | undefined;
            const queryMediaType = (options as any).mediaType as "all" | "audio" | "video" | undefined;

            console.log("[library/videos] Query params:", { limit: queryLimit, keyword: queryKeyword, mediaType: queryMediaType });

            const parsedLimit = Number(queryLimit);
            const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : undefined;
            const mediaType = queryMediaType === "audio" || queryMediaType === "video" ? queryMediaType : "all";

            return jobService.listVideos(limit, queryKeyword, mediaType);
        },
    },
    };
}
