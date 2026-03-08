import axios from "axios";
import type { OpenAPIV3 } from "openapi-types";
import type { DataSourceSchema, InferCreationSchema, InferPrimaryKey, InferTableSchema } from "@s-core/core";
import type { Condition, DataSource, FunctionDefinitions, InferFunctionTypes, Repository, selectFunctionDefinitions, Client } from "@s-core/core";

export type * from "@s-core/core";
export * from "./createFileClient.js";
/**
 * Creates a Repository module for performing CRUD operations.
 * @template Tables - The type of the main object.
 * @template C - The type of the creation object.
 * @template F - The type of the function definitions.
 *
 * @param client - The client to use for making requests.
 * @param schema - The schema for the main object.
 * @param creationSchema - The schema for the creation object.
 * @param functionDefinitions - The function definitions.
 * @returns A Repository module for performing CRUD operations.
 */
export function createDatasourceClient<
    Tables extends DataSourceSchema,
    F extends FunctionDefinitions = typeof selectFunctionDefinitions,
>(
    baseURL: string,
    options: {
        schema?: Tables,
        functionDefinitions?: F;
        schemaPath?: string | OpenAPIV3.Document;
        client?: Client;
    } = {}
): DataSource<Tables, InferFunctionTypes<F>> {
    const client: Client = options.client ? options.client : axios.create({ baseURL: baseURL });
    return {
        async get(table, key) {
            const res = await client.post(`/get`, { table, key });
            if (res.status !== 200) {
                throw new Error(`Failed to get: ${res.status} ${res.statusText}`);
            }
            return res.data as InferTableSchema<Tables[keyof Tables]> | null;
        },
        async insert(table, data) {
            const res = await client.post(`/insert`, { table, data });
            if (res.status !== 200) {
                throw new Error(`Failed to insert: ${res.status} ${res.statusText}`);
            }
            return res.data as InferPrimaryKey<Tables[keyof Tables]>[];
        },
        async find(table, query) {
            const res = await client.post(`/find`, { table, query });
            if (res.status !== 200) {
                throw new Error(`Failed to find: ${res.status} ${res.statusText}`);
            }
            return res.data as any;
        },
        async update(table, data, where) {
            const res = await client.post(`/update`, { table, data, where });
            if (res.status !== 200) {
                throw new Error(`Failed to update: ${res.status} ${res.statusText}`);
            }
        },
        async delete(table, where) {
            const res = await client.post(`/delete`, { table, where });
            if (res.status !== 200) {
                throw new Error(`Failed to delete: ${res.status} ${res.statusText}`);
            }
        },
        async select(tables, query) {
            const res = await client.post(`/select`, { tables, query });
            if (res.status !== 200) {
                throw new Error(`Failed to select: ${res.status} ${res.statusText}`);
            }
            return res.data as any;
        },
        createRepository<T extends keyof Tables>(table: T): Repository<Tables[T], InferFunctionTypes<F>> {
            return {
                get: (pk) => this.get(table, pk),
                create: async (data: InferCreationSchema<Tables[T]>) => (await this.insert<T>(table, [data]))[0],
                update: async (data: Partial<InferTableSchema<Tables[T]>> & InferPrimaryKey<Tables[T]>) => {
                    const where = [] as Condition<InferTableSchema<Tables[T]>, InferFunctionTypes<F>>[];
                    Object.keys(data).forEach((key) => {
                        where.push({ function: "eq", params: [key, { value: data[key as keyof typeof data] }] } as Condition<InferTableSchema<Tables[T]>, InferFunctionTypes<F>>);
                    });
                    await this.update(table, data, where);
                },
                delete: async (data) => {
                    const where = [] as Condition<InferTableSchema<Tables[T]>, InferFunctionTypes<F>>[];
                    Object.keys(data).forEach((key) => {
                        where.push({ function: "eq", params: [key, { value: data[key as keyof typeof data] }] } as Condition<InferTableSchema<Tables[T]>, InferFunctionTypes<F>>);
                    });
                    await this.update(table, data, where);
                    await this.delete(table, where);
                },
                find: async (req) => {
                    return this.find(table, req as any);
                },
                findOne: async (req) => {
                    const res = await this.find(table, req as any);
                    return res[0];
                }
            };
        }
    };
}

export * from "./OpenApiClient.js";

