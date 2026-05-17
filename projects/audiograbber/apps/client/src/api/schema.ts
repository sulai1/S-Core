import type { OpenAPIV3_1 } from 'openapi-types';

export const apiSchema: OpenAPIV3_1.Document = {
    openapi: '3.1.0',
    info: {
        title: 'AudioGrabber API',
        version: '0.0.1',
        description: 'Frontend schema mirror for typed client generation.',
    },
    servers: [{ url: 'http://localhost:3800' }],
    paths: {
        '/health': {
            get: {
                summary: 'Health status',
                responses: {
                    '200': {
                        description: 'Service healthy',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', enum: ['ok'] },
                                    },
                                    required: ['status'],
                                },
                            },
                        },
                    },
                },
            },
        },
        '/jobs/download': {
            post: {
                summary: 'Queue a download job',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    videoId: { type: 'string' },
                                    playlistId: { type: 'string' },
                                    priority: { type: 'integer', minimum: 1, maximum: 10 },
                                    outputFormat: { type: 'string', enum: ['mp3', 'source'], default: 'mp3' },
                                    embedMetadata: { type: 'boolean', default: true },
                                    songTitle: { type: 'string' },
                                    artist: { type: 'string' },
                                    album: { type: 'string' },
                                },
                                required: ['videoId'],
                            },
                        },
                    },
                },
                responses: {
                    '202': {
                        description: 'Job accepted',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        jobId: { type: 'string' },
                                        state: { type: 'string', enum: ['queued'] },
                                    },
                                    required: ['jobId', 'state'],
                                },
                            },
                        },
                    },
                },
            },
        },
        '/jobs/{jobId}': {
            get: {
                summary: 'Fetch job status',
                parameters: [
                    {
                        name: 'jobId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                    },
                ],
                responses: {
                    '200': {
                        description: 'Job status',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        jobId: { type: 'string' },
                                        state: { type: 'string', enum: ['queued', 'running', 'success', 'failed'] },
                                        progress: { type: 'integer', minimum: 0, maximum: 100 },
                                        error: { type: 'string' },
                                    },
                                    required: ['jobId', 'state'],
                                },
                            },
                        },
                    },
                    '404': {
                        description: 'Job not found',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: { error: { type: 'string' } },
                                    required: ['error'],
                                },
                            },
                        },
                    },
                },
            },
        },
        '/sync/channels/{channelId}': {
            post: {
                summary: 'Queue channel sync',
                parameters: [
                    {
                        name: 'channelId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                    },
                ],
                requestBody: {
                    required: false,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    maxResults: { type: 'integer', minimum: 1, maximum: 1000 },
                                    minDurationSeconds: {
                                        type: 'integer',
                                        minimum: 1,
                                        description: 'Only sync videos with a duration greater than or equal to this number of seconds.',
                                    },
                                    maxDurationSeconds: {
                                        type: 'integer',
                                        minimum: 1,
                                        description: 'Only sync videos with a duration less than or equal to this number of seconds.',
                                    },
                                    interval: {
                                        type: 'string',
                                        enum: ['immediate', 'daily', 'weekly'],
                                        default: 'immediate',
                                        description: 'immediate queues sync now; daily/weekly create a recurring schedule.',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '202': {
                        description: 'Sync accepted',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        jobId: { type: 'string' },
                                        channelId: { type: 'string' },
                                        scheduleId: { type: 'string' },
                                        nextRunAt: { type: 'string', format: 'date-time' },
                                        state: { type: 'string', enum: ['queued', 'scheduled'] },
                                    },
                                    required: ['jobId', 'channelId', 'state'],
                                },
                            },
                        },
                    },
                },
            },
        },
        '/sync/schedules': {
            get: {
                summary: 'List sync schedules with recent run logs',
                responses: {
                    '200': {
                        description: 'Schedules and recent run history',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        items: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    scheduleId: { type: 'string' },
                                                    channelId: { type: 'string' },
                                                    interval: { type: 'string', enum: ['daily', 'weekly'] },
                                                    enabled: { type: 'boolean' },
                                                    maxResults: { type: 'integer', nullable: true },
                                                    minDurationSeconds: { type: 'integer', nullable: true },
                                                    maxDurationSeconds: { type: 'integer', nullable: true },
                                                    lastRunAt: { type: 'string', format: 'date-time', nullable: true },
                                                    nextRunAt: { type: 'string', format: 'date-time' },
                                                    recentRuns: {
                                                        type: 'array',
                                                        items: {
                                                            type: 'object',
                                                            properties: {
                                                                jobId: { type: 'string' },
                                                                state: { type: 'string', enum: ['queued', 'running', 'success', 'failed'] },
                                                                channelId: { type: 'string' },
                                                                createdAt: { type: 'string', format: 'date-time' },
                                                                finishedAt: { type: 'string', format: 'date-time' },
                                                                videosDownloaded: { type: 'integer', nullable: true },
                                                                error: { type: 'string' },
                                                            },
                                                            required: ['jobId', 'state', 'channelId', 'createdAt', 'finishedAt'],
                                                        },
                                                    },
                                                },
                                                required: ['scheduleId', 'channelId', 'interval', 'enabled', 'nextRunAt', 'recentRuns'],
                                            },
                                        },
                                    },
                                    required: ['items'],
                                },
                            },
                        },
                    },
                },
            },
        },
        '/sync/schedules/{scheduleId}/run': {
            post: {
                summary: 'Trigger a schedule immediately',
                parameters: [
                    {
                        name: 'scheduleId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                    },
                ],
                responses: {
                    '202': {
                        description: 'Schedule execution queued',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        scheduleId: { type: 'string' },
                                        jobId: { type: 'string' },
                                        state: { type: 'string', enum: ['queued'] },
                                    },
                                    required: ['scheduleId', 'jobId', 'state'],
                                },
                            },
                        },
                    },
                    '404': {
                        description: 'Schedule not found',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: { error: { type: 'string' } },
                                    required: ['error'],
                                },
                            },
                        },
                    },
                },
            },
        },
        '/library/videos': {
            get: {
                summary: 'List videos in media library',
                parameters: [
                    {
                        name: 'limit',
                        in: 'query',
                        required: false,
                        schema: { type: 'integer', minimum: 1, maximum: 100 },
                    },
                    {
                        name: 'keyword',
                        in: 'query',
                        required: false,
                        schema: { type: 'string', minLength: 1 },
                    },
                    {
                        name: 'mediaType',
                        in: 'query',
                        required: false,
                        schema: { type: 'string', enum: ['all', 'audio', 'video'], default: 'all' },
                    },
                    {
                        name: 'tags',
                        in: 'query',
                        required: false,
                        style: 'form',
                        explode: true,
                        schema: { type: 'array', items: { type: 'string' } },
                    },
                    {
                        name: 'tagMode',
                        in: 'query',
                        required: false,
                        schema: { type: 'string', enum: ['all', 'any'], default: 'all' },
                    },
                ],
                responses: {
                    '200': {
                        description: 'Video list',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        items: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    id: { type: 'string' },
                                                    title: { type: 'string' },
                                                    status: { type: 'string', enum: ['ready', 'processing', 'failed'] },
                                                    artists: { type: 'array', items: { type: 'string' } },
                                                    albums: { type: 'array', items: { type: 'string' } },
                                                    tags: { type: 'array', items: { type: 'string' } },
                                                    year: { type: 'integer', nullable: true },
                                                    estimatedBpm: { type: 'number', nullable: true },
                                                    estimatedKey: { type: 'string', nullable: true },
                                                    thumbnailUrl: { type: 'string' },
                                                    metadata: {
                                                        type: 'object',
                                                        properties: {
                                                            fileName: { type: 'string' },
                                                            extension: { type: 'string' },
                                                            mediaType: { type: 'string', enum: ['audio', 'video'] },
                                                            sizeBytes: { type: 'integer', minimum: 0 },
                                                            createdAt: { type: 'string', format: 'date-time' },
                                                            modifiedAt: { type: 'string', format: 'date-time' },
                                                        },
                                                        required: ['fileName', 'extension', 'mediaType', 'sizeBytes', 'createdAt', 'modifiedAt'],
                                                    },
                                                },
                                                required: ['id', 'title', 'status', 'metadata', 'tags', 'artists', 'albums'],
                                            },
                                        },
                                    },
                                    required: ['items'],
                                },
                            },
                        },
                    },
                },
            },
        },
        '/library/tags': {
            get: {
                summary: 'List all tags used in media library',
                responses: {
                    '200': {
                        description: 'Distinct tags with usage counts',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['items'],
                                    properties: {
                                        items: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                required: ['tag', 'count'],
                                                properties: {
                                                    tag: { type: 'string' },
                                                    count: { type: 'integer', minimum: 0 },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/channels/overview': {
            get: {
                summary: 'Fetch channel overview and videos',
                parameters: [
                    { name: 'channel', in: 'query', required: false, schema: { type: 'string' } },
                    { name: 'channelId', in: 'query', required: false, schema: { type: 'string' } },
                    { name: 'handle', in: 'query', required: false, schema: { type: 'string' } },
                    { name: 'maxResults', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 200, default: 100 } },
                ],
                responses: {
                    '200': {
                        description: 'Channel overview',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        channel: {
                                            type: 'object',
                                            properties: {
                                                id: { type: 'string' },
                                                title: { type: 'string' },
                                                description: { type: 'string' },
                                                customUrl: { type: 'string' },
                                                videoCount: { type: 'integer', minimum: 0 },
                                            },
                                            required: ['id', 'title'],
                                        },
                                        videos: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    videoId: { type: 'string' },
                                                    title: { type: 'string' },
                                                    publishedAt: { type: 'string', format: 'date-time' },
                                                    thumbnailUrl: { type: 'string' },
                                                    duration: { type: 'string' },
                                                    viewCount: { type: 'integer', minimum: 0 },
                                                    likeCount: { type: 'integer', minimum: 0 },
                                                    description: { type: 'string' },
                                                    tags: { type: 'array', items: { type: 'string' } },
                                                    artist: { type: 'string' },
                                                    songTitle: { type: 'string' },
                                                    album: { type: 'string' },
                                                },
                                                required: ['videoId', 'title', 'publishedAt'],
                                            },
                                        },
                                    },
                                    required: ['channel'],
                                },
                            },
                        },
                    },
                },
            },
        },
        '/system/info': {
            get: {
                summary: 'System info including yt-dlp version',
                responses: {
                    '200': {
                        description: 'System info',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['ytDlp'],
                                    properties: {
                                        ytDlp: {
                                            type: 'object',
                                            required: ['version', 'latestVersion', 'upToDate'],
                                            properties: {
                                                version: { type: 'string' },
                                                latestVersion: { type: 'string' },
                                                upToDate: { type: 'boolean' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};
