import { OpenAPIV3_1 } from "openapi-types";

export type FileUploadResult = {
    filename?: string;
    size?: number;
    path?: string;
};

export type FileUploadBody<FileValue = unknown> = {
    /** @description Files to upload */
    files: FileValue[];
    /** @description Optional filename overrides for uploaded files (same order as files) */
    filenames?: string[];
};

export type FilePaths<Path extends string, FileValue = unknown> = Record<Path, {
    parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Upload files
     * @description Upload files using multipart/form-data
     */
    post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": FileUploadBody<FileValue>;
            };
        };
        responses: {
            /** @description Files uploaded successfully */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": FileUploadResult[];
                };
            };
            /** @description Invalid file or missing file */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Server error during upload */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
}>
    & Record<`${Path}/{filename}`, {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Download a file
         * @description Download a file by filename
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description Name of the file to retrieve */
                    filename: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description File contents */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/octet-stream": string;
                        "image/png": string;
                        "image/jpeg": string;
                        "image/gif": string;
                    };
                };
                /** @description File not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        post?: never;
        put?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    }>;

export function createFileSchema<Path extends string>(path: Path): OpenAPIV3_1.Document {
    return {
        openapi: "3.1.0",
        info: {
            title: "File Module API",
            version: "1.0.0",
            summary: "API for testing file upload and download"
        },
        paths: {
            [path]: {
                post: {
                    summary: "Upload files",
                    requestBody: {
                        required: true,
                        content: {
                            "multipart/form-data": {
                                schema: {
                                    type: "object",
                                    required: ["files"],
                                    additionalProperties: false,
                                    properties: {
                                        files: {
                                            type: "array",
                                            minItems: 1,
                                            items: {
                                                type: "string",
                                                format: "binary"
                                            }
                                        },
                                        filenames: {
                                            type: "array",
                                            items: {
                                                type: "string"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        "200": {
                            description: "Files uploaded successfully",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                filename: { type: "string" },
                                                size: { type: "number" },
                                                path: { type: "string" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            [path + "/{filename}"]: {
                get: {
                    summary: "Download file",
                    parameters: [
                        {
                            name: "filename",
                            in: "path",
                            required: true,
                            schema: { type: "string" }
                        }
                    ],
                    responses: {
                        "200": {
                            description: "File downloaded successfully",
                            content: {
                                "application/octet-stream": {
                                    schema: {
                                        type: "string",
                                        format: "binary"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        components: {},
        webhooks: {}
    } satisfies OpenAPIV3_1.Document;
} 