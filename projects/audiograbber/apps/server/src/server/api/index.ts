export interface paths {
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Health status */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Service healthy */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {string} */
                            status: "ok";
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/jobs/download": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Queue a download job */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        videoId: string;
                        playlistId?: string;
                        priority?: number;
                        /**
                         * @description mp3 converts/extracts audio as MP3, source keeps original downloaded format.
                         * @default mp3
                         * @enum {string}
                         */
                        outputFormat?: "mp3" | "source";
                        /**
                         * @description Embed available metadata tags into the output media file.
                         * @default true
                         */
                        embedMetadata?: boolean;
                    };
                };
            };
            responses: {
                /** @description Job accepted */
                202: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            jobId: string;
                            /** @enum {string} */
                            state: "queued";
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/jobs/{jobId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Fetch job status */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    jobId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Job status */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            jobId: string;
                            /** @enum {string} */
                            state: "queued" | "running" | "success" | "failed";
                            progress?: number;
                            error?: string;
                        };
                    };
                };
                /** @description Job not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: string;
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/sync/channels/{channelId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Queue channel sync */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description Channel reference. Accepts canonical channel ID (UC...) or @channel_name handle. */
                    channelId: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        /** @description Maximum number of new videos to download after duration filtering and excluding already-downloaded videos. */
                        maxResults?: number;
                        /** @description Only sync videos with a duration greater than or equal to this number of seconds. */
                        minDurationSeconds?: number;
                        /** @description Only sync videos with a duration less than or equal to this number of seconds. */
                        maxDurationSeconds?: number;
                        /**
                         * @description immediate queues sync now; daily/weekly create a recurring schedule.
                         * @default immediate
                         * @enum {string}
                         */
                        interval?: "immediate" | "daily" | "weekly";
                    };
                };
            };
            responses: {
                /** @description Sync accepted */
                202: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            jobId: string;
                            channelId: string;
                            scheduleId?: string;
                            /** Format: date-time */
                            nextRunAt?: string;
                            /** @enum {string} */
                            state: "queued" | "scheduled";
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/sync/schedules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List sync schedules with recent run logs */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Schedules and recent run history */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            items: {
                                scheduleId: string;
                                channelId: string;
                                /** @enum {string} */
                                interval: "daily" | "weekly";
                                enabled: boolean;
                                maxResults?: number | null;
                                minDurationSeconds?: number | null;
                                maxDurationSeconds?: number | null;
                                /** Format: date-time */
                                lastRunAt?: string | null;
                                /** Format: date-time */
                                nextRunAt: string;
                                recentRuns: {
                                    jobId: string;
                                    /** @enum {string} */
                                    state: "queued" | "running" | "success" | "failed";
                                    channelId: string;
                                    /** Format: date-time */
                                    createdAt: string;
                                    /** Format: date-time */
                                    finishedAt: string;
                                    videosDownloaded?: number | null;
                                    error?: string;
                                }[];
                            }[];
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/sync/schedules/{scheduleId}/run": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Trigger a schedule immediately */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    scheduleId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Schedule execution queued */
                202: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            scheduleId: string;
                            jobId: string;
                            /** @enum {string} */
                            state: "queued";
                        };
                    };
                };
                /** @description Schedule not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: string;
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/channels/overview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Fetch channel overview and videos */
        get: {
            parameters: {
                query?: {
                    /** @description Channel reference, either @channel_name or channel ID (UC...). */
                    channel?: string;
                    /** @description Optional alias for channel using channel ID (UC...). */
                    channelId?: string;
                    /** @description Optional alias for channel using @channel_name. */
                    handle?: string;
                    /** @description Max number of videos to return. */
                    maxResults?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Channel overview */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            channel: {
                                id: string;
                                title: string;
                                description?: string;
                                customUrl?: string;
                                videoCount?: number;
                            };
                            videos?: {
                                videoId: string;
                                title: string;
                                /** Format: date-time */
                                publishedAt: string;
                                thumbnailUrl?: string;
                                /** @description ISO 8601 duration format (e.g., PT5M30S) */
                                duration?: string;
                                viewCount?: number;
                                likeCount?: number;
                                description?: string;
                                tags?: string[];
                                /** @description Extracted artist name from YouTube Music metadata */
                                artist?: string;
                                /** @description Extracted song title from YouTube Music metadata */
                                songTitle?: string;
                                /** @description Extracted album name from YouTube Music metadata */
                                album?: string;
                            }[];
                        };
                    };
                };
                /** @description Invalid input */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: string;
                        };
                    };
                };
                /** @description Upstream API error */
                502: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: string;
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/library/videos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List videos in media library */
        get: {
            parameters: {
                query?: {
                    limit?: number;
                    /** @description Case-insensitive match against downloaded file names. */
                    keyword?: string;
                    /** @description Filter library entries by media type. */
                    mediaType?: "all" | "audio" | "video";
                    /** @description Filter by tag names. Repeat query key for multiple tags. */
                    tags?: string[];
                    /** @description all = media must have all provided tags, any = media may have any provided tag. */
                    tagMode?: "all" | "any";
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Video list */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            items: {
                                id: string;
                                title: string;
                                /** @enum {string} */
                                status: "ready" | "processing" | "failed";
                                artists: string[];
                                albums: string[];
                                tags?: string[];
                                /** Format: date-time */
                                date?: string | null;
                                estimatedBpm?: number | null;
                                estimatedKey?: string | null;
                                thumbnailUrl?: string;
                                metadata: {
                                    fileName: string;
                                    extension: string;
                                    /** @enum {string} */
                                    mediaType: "audio" | "video";
                                    sizeBytes: number;
                                    /** Format: date-time */
                                    createdAt: string;
                                    /** Format: date-time */
                                    modifiedAt: string;
                                };
                            }[];
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/library/tags": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List all tags used in media library */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Distinct tags with usage counts */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            items: {
                                tag: string;
                                count: number;
                            }[];
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/system/info": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** System info including yt-dlp version */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description System info */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            ytDlp: {
                                version: string;
                                latestVersion: string;
                                upToDate: boolean;
                            };
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: never;
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
