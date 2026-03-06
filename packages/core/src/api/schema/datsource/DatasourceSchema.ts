import type { OpenAPIV3 } from "express-openapi-validator/dist/framework/types";
import { InferCreationSchema, InferPrimaryKey, InferTableSchema, TableSchema } from "./TableSchema";
import { createComponents } from "./components";
import { paths } from "./paths";


export type DataSourceSchema = {
    [K: string]: TableSchema;
};
export type TableCreationTypes<Tables extends DataSourceSchema> = {
    [K in keyof Tables]: InferCreationSchema<Tables[K]>;
};
export type TableInstanceTypes<Tables extends DataSourceSchema> = {
    [K in keyof Tables]: InferTableSchema<Tables[K]>;
};
export type TablePrimaryKeyTypes<Tables extends DataSourceSchema> = {
    [K in keyof Tables]: InferPrimaryKey<Tables[K]>;
};

export function schemaReduce<Tables extends DataSourceSchema>(
    schema: Tables, options?: {
        filterColumns?: (tableName: string, columnName: string) => boolean,
        transform?: (tableName: string, table: TableSchema, schema: OpenAPIV3.SchemaObject) => OpenAPIV3.SchemaObject | undefined,
        renameKey?: (tableName: string) => string,
    }
) {
    const tables = Object.entries(schema).reduce((components, [key, value]) => {
        const properties: Record<string, OpenAPIV3.SchemaObject> = Object.entries(value.columns).reduce((acc, [columnKey, column]) => {
            if (options?.filterColumns && !options.filterColumns(key, columnKey)) {
                return acc;
            }
            const schemaObject: OpenAPIV3.SchemaObject = {
                type: column.type === String ? "string" :
                    column.type === Number ? "number" :
                        column.type === Boolean ? "boolean"
                            : "string",
                default: column.default,
                description: column.description,
                nullable: column.nullable,

            };

            acc[columnKey] = schemaObject;
            return acc;
        }, {} as Record<string, OpenAPIV3.SchemaObject>);
        const componentKey = options?.renameKey ? options.renameKey(key) : key;

        const schemaObject: OpenAPIV3.SchemaObject = {
            type: "object",
            properties,
            description: value.description,
            required: Object.entries(value.columns).filter(([_, column]) => !column.nullable && column.default === undefined).map(([columnKey, _]) => columnKey),
        } as OpenAPIV3.SchemaObject;

        const transformed = options?.transform ? options.transform(key, value, schemaObject) : schemaObject;
        if (transformed) {
            components[componentKey] = transformed;
        }
        return components;
    }, {} as Record<string, OpenAPIV3.SchemaObject>);
    return tables;
}

export function createDatasourceSchema<Tables extends DataSourceSchema>(url: string, t: Tables): OpenAPIV3.DocumentV3_1 {
    const tables = schemaReduce(t);
    const partials = schemaReduce(t, {
        transform: (_, __, schema) => {
            return {
                ...schema,
                required: [],
            }
        },
        renameKey: (tableName) => `${tableName}_partial`,
    });

    const creations = schemaReduce(t, {

        transform: (tableName, table, schema) => {
            const required = Object.entries(table.columns)
                .filter(([_, column]) => !column.nullable && !column.default && !column.generated)
                .map(([columnKey, _]) => columnKey);
            return {
                ...schema,
                required,
            }
        },
        renameKey: (columnName) => columnName + "_create",
    });

    const pks = schemaReduce(t, {
        filterColumns: (tableName, columnName) => {
            const column = t[tableName].columns[columnName];
            return column.primary ?? false;
        },
        transform: (tableName, table, schema) => {
            // Only require primary key columns
            const required = Object.keys(schema.properties || {});
            return {
                ...schema,
                required,
            };
        },
        renameKey: (columnName) => columnName + "_pk",
    });


    const columnName: OpenAPIV3.SchemaObject =
    {
        type: "string",
        enum: Object.values(t).flatMap(table => Object.keys(table.columns)),
    };

    const tableColumnName: OpenAPIV3.SchemaObject =
    {
        type: "string",
        enum: Object.entries(t).flatMap(([tableName, table]) => Object.keys(table.columns).map(columnName => `${tableName}.${columnName}`)),
    };

    const schema: OpenAPIV3.DocumentV3_1 = {
        openapi: "3.1.0",
        info: {
            title: "Datasource API",
            version: "1.0.0",
            summary: "API for interacting with a datasource",
        },
        servers: [
            {
                url: url,
                description: "Version 1",
                variables: {},
            }
        ],
        paths: paths,
        components: createComponents(tables, creations, pks, partials, columnName, tableColumnName),
        webhooks: {},
    }
    return schema
}



