import { vi } from "vitest";
import {  createDatasourceSchema, DataSource, DataSourcePaths, DataSourceSchema, selectFunctionDefinitions, SelectFunctionDefinitions } from "@s-core/core";
import { createDatasourceClient } from "../src/index.js";

export const Tables = {
    test: {
        name: "test",
        columns: {
            id: {
                type: Number,
                primary: true,
                generated: true,
            },
            name: {
                type: String,
            }
        }
    },
} as const satisfies DataSourceSchema;

const paths = createDatasourceSchema("test", Tables);

export const datasource = {
    get: vi.fn(),
    query: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    find: vi.fn(),
    select: vi.fn(),
    createRepository: vi.fn(),
};
export type Paths = DataSourcePaths<DataSource<typeof Tables, SelectFunctionDefinitions>>;

export const client = {
    get: vi.fn(),
    delete: vi.fn(),
    head: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
};

export const clientDatasource = createDatasourceClient("test", {
    schema: Tables,
    functionDefinitions: selectFunctionDefinitions,
    client
});
