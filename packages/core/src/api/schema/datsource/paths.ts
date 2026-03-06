import type { OpenAPIV3_1 } from "openapi-types";


const get = {
    post: {
        summary: "Get a record by primary key",
        requestBody: {
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            table: {
                                $ref: "#/components/schemas/tableName",
                            },
                            key: {
                                $ref: "#/components/schemas/pk",
                            },
                        },
                        required: ["table", "key"],
                    }
                }
            }
        },
        responses: {
            "200": {
                description: "Record",
                content: {
                    "application/json": {
                        schema: {
                            $ref: "#/components/schemas/tableSchema",
                        },
                    },
                },
            },
        },
    }
} as const satisfies OpenAPIV3_1.PathItemObject;
const insert = {
    post: {
        summary: "Insert records",
        requestBody: {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            table: {
                                $ref: "#/components/schemas/tableName",
                            },
                            data: {
                                type: "array",
                                items: {
                                    $ref: "#/components/schemas/creation",
                                },
                                minItems: 1,
                            },
                        },
                        required: ["table", "data"],
                    },
                },
            },
        },
        responses: {
            "200": {
                description: "Primary keys",
                content: {
                    "application/json": {
                        schema: {
                            type: "array",
                            items: {
                                $ref: "#/components/schemas/pk",
                            },
                        },
                    },
                },
            },
        },
    },
} as const satisfies OpenAPIV3_1.PathItemObject;
const update = {
    post: {
        summary: "Update records",
        requestBody: {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            table: {
                                $ref: "#/components/schemas/tableName",
                            },
                            data: {
                                $ref: "#/components/schemas/creation",
                            },
                            where: {
                                type: "array",
                                items: {
                                    $ref: "#/components/schemas/function",
                                },
                                minItems: 1,
                            }
                        },
                        required: ["table", "data", "where"],
                    },
                },
            },
        },
        responses: {
            "200": {
                description: "Update result",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: {
                                    type: "object",
                                    properties: {
                                        affectedRows: { type: "number" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
} as const satisfies OpenAPIV3_1.PathItemObject;
const del = {
    post: {
        summary: "Delete records",
        requestBody: {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            table: {
                                $ref: "#/components/schemas/tableName",
                            },
                            where: {
                                type: "array",
                                items: {
                                    $ref: "#/components/schemas/function",
                                },
                                minItems: 1,
                            },
                        },
                        required: ["table", "where"],
                    },
                },
            },
        },
        responses: {
            "200": {
                description: "Delete result",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                affectedRows: { type: "number" },
                            },
                        },
                    },
                },
            },
        },
    },
} as const satisfies OpenAPIV3_1.PathItemObject;
const find = {
    post: {
        summary: "Find records",
        requestBody: {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            table: {
                                $ref: "#/components/schemas/tableName",
                            },
                            query: {
                                $ref: "#/components/schemas/findRequest",
                            }
                        },
                        required: ["table", "query"],
                    }
                },
            },
        },
        responses: {
            "200": {
                description: "Found records",
                content: {
                    "application/json": {
                        schema: {
                            type: "array",
                            items: {
                                type: "object",
                                additionalProperties: true,
                            },
                        },
                    },
                },
            },
        },
    },
} as const satisfies OpenAPIV3_1.PathItemObject;
const select: OpenAPIV3_1.PathItemObject = {
    post: {
        summary: "Select with joins",
        requestBody: {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            tables: {
                                type: "object",
                                additionalProperties: {
                                    $ref: "#/components/schemas/tableName",
                                },
                            },
                            query: {
                                $ref: "#/components/schemas/queryRequest",
                            }
                        },
                        required: ["tables", "query"],
                    },
                },
            },
        },
        responses: {
            "200": {
                description: "Selected records",
                content: {
                    "application/json": {
                        schema: {
                            type: "array",
                            items: {
                                type: "object",
                                additionalProperties: true,
                            },
                        },
                    },
                },
            },
        },
    },
} as const satisfies OpenAPIV3_1.PathItemObject;

export const paths = {
    "/get": get,
    "/insert": insert,
    "/update": update,
    "/delete": del,
    "/find": find,
    "/select": select,
} as const satisfies Record<string, OpenAPIV3_1.PathItemObject>;
