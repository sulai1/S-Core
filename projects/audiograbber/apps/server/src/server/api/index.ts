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
                    channelId: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        maxResults?: number;
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
                                year?: number | null;
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
