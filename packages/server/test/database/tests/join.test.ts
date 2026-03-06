
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { Database,  SqliteDialect } from "../../../src/index.js";
import { selectFunctionDefinitions } from "@s-core/core";

const SchemaA = {
    name: "A",
    columns: {
        a: { type: String },
        b: { type: Number, primary: true },
    }
} as const;

const SchemaB = {
    name: "B",
    columns: {
        b: { type: Number, primary: true },
        c: { type: String },
    }
} as const;

const db = new Database({
    tables: { A: SchemaA, B: SchemaB },
    database: ":memory:",
    synchronize: true,
    dialect: new SqliteDialect(),
    functions: selectFunctionDefinitions,
})

beforeAll(async () => {
    await db.connect();
    await db.insert("A", [{ a: "a1", b: 1 }]);
    await db.insert("B", [{ b: 1, c: "c1" }]);
    await db.insert("A", [{ a: "a2", b: 2 }]);
    await db.insert("B", [{ b: 2, c: "c2" }]);
});

afterAll(async () => {
    await db.delete("A", []);
    await db.delete("B", []);
    await db.close();
});

describe("join", () => {
    test("join of two tables", async () => {

        const res = await db.select({ a: "A", b: "B" }, {
            attributes: {
                a_a: "a.a",
                a_b: "a.b",
                b_c: "b.c"
            },
            where: [{ function: "=", params: ["a.b", "b.b"] }],
        });
        expect(res).toEqual([
            { "a_a": "a1", "a_b": 1, "b_c": "c1" },
            { "a_a": "a2", "a_b": 2, "b_c": "c2" }
        ]);
    });
    test("join tables with it self", async () => {
        const res = await db.select({
            a: "B",
            b: "B"
        }, {
            attributes: {
                a_c: "a.c",
                a_b: "a.b",
                b_c: "b.c",
                b_b: "b.b"
            },
            where: [{ function: "=", params: ["a.b", "b.b"] }],
        });
        expect(res).toEqual([
            { "a_c": "c1", "a_b": 1, "b_c": "c1", "b_b": 1 },
            { "a_c": "c2", "a_b": 2, "b_c": "c2", "b_b": 2 }
        ]);
    });
});
