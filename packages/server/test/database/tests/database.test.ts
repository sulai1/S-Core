import 'reflect-metadata';
import { EntitySchemaOptions } from 'typeorm';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { Database } from '../../../src/database/index.js';
import { SqliteDialect } from '../../../src/database/SqliteDialect.js';
import { selectFunctionDefinitions } from '@s-core/core';


const s = {
    name: "TestModel",
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: true,
        },
        name: {
            type: String,
        },
        test: {
            type: String,
            nullable: true,
        },
    },
} as const satisfies EntitySchemaOptions<any>;

const Test = {
    name: "Test",
    columns: {
        a: {
            type: Number,
            primary: true,
        },
        b: {
            type: Number,
        },
    },
} as const satisfies EntitySchemaOptions<any>;

let db = new Database({
    database: ":memory:",
    synchronize: true,
    functions: selectFunctionDefinitions,
    tables: { s: s, Test: Test },
    dialect: new SqliteDialect(),
});

beforeAll(async () => {
    await db.connect();
});

afterAll(async () => {
    await db.close();
});

describe("Database Tests", () => {
    test("Should connect to postgres on localhost", async () => {
        const res = await db.query<any>("SELECT 1");
        expect(res).toBeDefined();

        await db.insert("s", [{ name: "test", id: 1 }]);
        await db.insert("Test", [{ a: 0, b: 1 }]);

        const res2 = await db.select({ a: "Test" }, {
            attributes: {
                a: "a.a",
                b: "a.b"
            },
            where: [{ function: "=", params: ["a.b", { value: 1 }] }],
        })

        expect(res2).toBeDefined();
        expect(res2.length).toBe(1);
        expect(res2[0].a).toBe(0);
        expect(res2[0].b).toBe(1);

        await db.update("Test", { "a": 2 }, [{ function: "=", params: ["a", { value: 0 }] }]);

        const res3 = await db.find("Test", {
            attributes: {
                a: "a",
                b: "b"
            },
            where: [{ function: "=", params: ["a", { value: 2 }] }],
        })
        expect(res3).toBeDefined();
        expect(res3.length).toBe(1);
        expect(res3[0].a).toEqual(2);

        await db.delete("Test", [{ function: "=", params: ["a", { value: 2 }] }]);
        const res4 = await db.select({ a: "Test" }, {
            attributes: {
                a: "a.a",
                b: "a.b"
            },
            where: [
                { function: "=", params: ["a.a", { value: 2 }] }
            ],
        })
        expect(res4).toBeDefined();
        expect(res4.length).toBe(0);
    });
});