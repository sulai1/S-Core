import type { OpenAPIV3_1  } from "openapi-types";
import { DataSourceSchema } from "./DatasourceSchema.js";


export function createComponents<Tables extends DataSourceSchema>(
    tables: Record<keyof Tables, OpenAPIV3_1.SchemaObject>,
    creationTables: Record<`${(keyof Tables) & string}_create`, OpenAPIV3_1.SchemaObject>,
    primaryKeyTables: Record<`${(keyof Tables) & string}_pk`, OpenAPIV3_1.SchemaObject>,
    partialTables: Record<`${(keyof Tables) & string}_partial`, OpenAPIV3_1.SchemaObject>,
    columnName: OpenAPIV3_1.SchemaObject,
    tableColumnName: OpenAPIV3_1.SchemaObject,
): OpenAPIV3_1.ComponentsObject {

    const value: OpenAPIV3_1.SchemaObject = {
        type: "object",
        properties: {
            value: {
                anyOf: [
                    { type: "number" },
                    { type: "boolean" },
                    { type: "string" },
                ],
            },
        },
        required: ["value"],
    };

    const expression: OpenAPIV3_1.SchemaObject = {
        anyOf: [
            { $ref: "#/components/schemas/value" },
            { $ref: "#/components/schemas/function" },
            { $ref: "#/components/schemas/columnName" },
        ],
    }

    const anyFunction: OpenAPIV3_1.NonArraySchemaObject = {
        type: "object",
        properties: {
            function: {
                type: "string",
            },
            params: {
                type: "array",
                items: {
                    anyOf: [
                        {
                            $ref: "#/components/schemas/columnName"
                        }, {
                            $ref: "#/components/schemas/value"
                        }, {
                            $ref: "#/components/schemas/function"
                        }
                    ],
                }
            }
        },
        required: ["function", "params"],
    };

    const findRequest: OpenAPIV3_1.SchemaObject = {
        type: "object",
        properties: {
            where: {
                type: "array",
                items: {
                    $ref: "#/components/schemas/function",
                },
            },
            attributes: {
                type: "object",
                additionalProperties: {
                    anyOf: [{
                        $ref: "#/components/schemas/function",
                    }, {
                        $ref: "#/components/schemas/columnName",
                    }]
                },
            },
            orderBy: {
                type: "array",
                items: {
                    type: "array",
                    items: {
                        anyOf: [
                            { $ref: "#/components/schemas/expression" },
                            { type: "string", enum: ["asc", "desc"] },
                        ],
                        minItems: 2,
                        maxItems: 2,
                    },
                },
            },
            groupBy: {
                type: "array",
                items: {
                    $ref: "#/components/schemas/expression",
                },
            },
            limit: {
                type: "number",
            },
            offset: {
                type: "number",
            },
        },
    }

    const tableFunction: OpenAPIV3_1.SchemaObject = {
        type: "object",
        properties: {
            function: {
                type: "string",
            },
            params: {
                type: "array",
                items: {
                    anyOf: [
                        {
                            $ref: "#/components/schemas/tableColumnName"
                        }, {
                            $ref: "#/components/schemas/value"
                        }, {
                            $ref: "#/components/schemas/tableFunction"
                        }
                    ],
                }
            }
        },
        required: ["function", "params"],
    };


    const tableExpression: OpenAPIV3_1.SchemaObject = {
        anyOf: [
            { $ref: "#/components/schemas/value" },
            { $ref: "#/components/schemas/tableFunction" },
            { $ref: "#/components/schemas/tableColumnName" },
        ],
    }

    const queryRequest: OpenAPIV3_1.SchemaObject = {
        type: "object",
        properties: {
            where: {
                type: "array",
                items: {
                    $ref: "#/components/schemas/tableFunction",
                },
            },
            attributes: {
                type: "object",
                additionalProperties: {
                    anyOf: [{
                        $ref: "#/components/schemas/tableFunction",
                    }, {
                        $ref: "#/components/schemas/tableColumnName",
                    }]
                },
            },
            orderBy: {
                type: "array",
                items: {
                    type: "array",
                    items: {
                        anyOf: [{
                            $ref: "#/components/schemas/tableExpression",
                        }, {
                            type: "string",
                            enum: ["asc", "desc"],
                        }],
                        minItems: 2,
                        maxItems: 2,
                    },
                },
            },
            groupBy: {
                type: "array",
                items: {
                    $ref: "#/components/schemas/tableExpression",
                },
            },
            limit: {
                type: "number",
            },
            offset: {
                type: "number",
            },
        },
    }

    const tableSchema: OpenAPIV3_1.SchemaObject = {
        anyOf: Object.keys(tables).map(tableName => ({ $ref: `#/components/schemas/${tableName}` })),
    };

    const tableName: OpenAPIV3_1.SchemaObject = {
        type: "string",
        enum: Object.keys(tables),
    }

    const partial: OpenAPIV3_1.SchemaObject = {
        anyOf: Object.keys(tables).map(tableName => ({ $ref: `#/components/schemas/${tableName}_partial` })),
    }

    const creation: OpenAPIV3_1.SchemaObject = {
        anyOf: Object.keys(tables).map(tableName => ({ $ref: `#/components/schemas/${tableName}_create` })),
    }

    const pk: OpenAPIV3_1.SchemaObject = {
        anyOf: Object.keys(tables).map(tableName => ({ $ref: `#/components/schemas/${tableName}_pk` })),
    }
    return {
        schemas: {
            tableSchema,
            tableName,
            partial,
            creation,
            pk,
            columnName,
            tableColumnName,
            value,
            function: anyFunction,
            expression,
            findRequest,
            tableFunction,
            tableExpression,
            queryRequest,
            ...tables,
            ...partialTables,
            ...creationTables,
            ...primaryKeyTables,
        },
    };
}