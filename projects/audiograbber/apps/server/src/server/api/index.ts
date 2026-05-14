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
                        outputFormat?: "mp3" | "source";
                        embedMetadata?: boolean;
                        songTitle?: string;
                        artist?: string;
                        album?: string;
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
                query: {
                    channel: string;
                    channelId?: string;
                    handle?: string;
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
                                publishedAt: string;
                                thumbnailUrl?: string;
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
