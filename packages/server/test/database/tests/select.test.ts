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
        fk:{
            type: Number,
            nullable: true,
        }
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
    await db.insert("Test", [{ a: 1, b: 2 }]);
    await db.insert("s", [{ name: "test1" }, { name: "test2", test: "test", fk: 1 }]);
});

afterAll(async () => {
    await db.query("DELETE FROM s");
    await db.query("DELETE FROM Test");
    await db.close();
});

describe("Database Tests", () => {
    test("Should return normalized attributes if no attributes are specified", async () => {
        const res = await db.select({ a: "Test", b: "s" }, {});
        const keys = Object.keys(res[0]);
        expect(keys).toContain("a.a");
        expect(keys).toContain("b.name");
    });
});