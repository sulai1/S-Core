import { describe, test } from "vitest";
import { DataSource, SelectFunctionDefinitions, TableSchema } from "../../src/index.js";

type A = TableSchema<{ a: number; b: number; name: string; bool: boolean }>;
type B = TableSchema<{ a: number; b: number; name: string; bool: boolean }>;

const ds: DataSource<{ a: A, b: B }, SelectFunctionDefinitions> = {
    createRepository: (table) => {
        return {} as any;
    },
    delete: async (table, where) => { },
    find: async (table, query) => {
        return {} as any;
    },
    get: async (table, key) => {
        return null;
    },
    insert: async (table, data) => {
        return [] as any;
    },
    query: async (query) => {
        return [] as any;
    },
    select: async (tables, query) => {
        return {} as any;
    },
    update: async (table, data, where) => { }
}

describe('Check type safety for DataSource', () => {
    test('get method', async () => {
        const res = await ds.get("a", 1);
        if (res) {
            res.a; // should be number
            res.b; // should be number
            res.name; // should be string
            res.bool; // should be boolean
        }
    });
    test('select method', async () => {
        const res = await ds.select({ a: "a", b: "b" }, {
            attributes: {
                aA: "a.a",
                aB: "a.b",
                bName: "b.name",
                bBool: "b.bool"
            },
            where: [
                {
                    function: "=",
                    params: [
                        "a.a",
                        { value: 1 }
                    ]
                }
            ],
            limit: 10,
            offset: 0,
            orderBy: [["a.name", "asc"]]
        });
    });
});