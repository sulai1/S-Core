import { BaseError, selectFunctionDefinitions } from "@s-core/core";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { Database, SqliteDialect } from "../../../src";
import { TestModelSchema, testRows, tests } from "../params/find.params";


const db = new Database({
    dialect: new SqliteDialect(),
    synchronize: true,
    database: ":memory:",
    tables: { TestModel: TestModelSchema },
    functions: selectFunctionDefinitions,
});

beforeAll(async () => {
    await db.connect()
    const res = await db.insert("TestModel", testRows);
    expect(res.length).toBe(testRows.length);
}, 10000);

afterAll(async () => {
    await db.delete("TestModel", []);
    await db.close();
}, 10000);

describe("Find Tests", () => {
    test("Should return correct type", async () => {
        const res = await db.find("TestModel", {
            attributes: {
                y: { function: "min", params: ["id"] },
                c: { function: "count", params: ["createdAt"] },
                s: { function: "*", params: [{ function: "*", params: ["id", "sort"] }, { value: 3 }] },
            }
        });
        expect(res).toHaveLength(1);


        // to enshure that typescrript infers the correct type at compile time
        const dtype = res[0];
        // but also at runtime
        expect(typeof dtype.y).toBe("number");
        expect(typeof dtype.c).toBe("number");
        expect(typeof dtype.s).toBe("number");
    });


    test.each(Object.keys(tests))("%s", async (key) => {
        const t = tests[key];
        if (!t.options) throw new BaseError("Test not found");
        const res = await db.find("TestModel", t.options);
        expect(res.length).toBe(t.rows);
        if (!t.expected) return; res
        for (const val of t.expected) {
            const x = res[val.index] as any;
            if (x && val.field in x) {
                if (val.f) {
                    expect(val.f(x[val.field])).toBe(val.f(val.value));
                } else {
                    expect(x[val.field]).toBe(val.value);
                }
            }
        }
    })
});