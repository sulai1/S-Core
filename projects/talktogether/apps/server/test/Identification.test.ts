import { DataSource, SelectFunctionDefinitions, selectFunctionDefinitions } from "@s-core/core";
import { Database, PostgresDialect } from "@s-core/server";
import { tables } from "@s-core/talktogether";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { getNewID } from "../src/pdf";

const db = new Database({
    database: "talktogether_dev",
    dialect: new PostgresDialect(),
    functions: selectFunctionDefinitions,
    user: "postgres",
    host: "127.0.0.1",
    password: process.env.DB_PASSWORD,
    tables: tables,
});
let salesmanId: number;
let otherSalesmanId: number;

beforeAll(async () => {
    await db.connect();
    const res = await db.insert("Salesman", [{
        first: "Test",
        last: "Salesman",
    }, {
        first: "Other",
        last: "Salesman",
    }]);
    salesmanId = res[0].id ?? 0;
    otherSalesmanId = res[1].id ?? 0;
    expect(res[0].id).toBeDefined();
    expect(res[1].id).toBeDefined();

});

afterEach(async () => {
    await db.delete("Identification", [{ function: ">", params: ["id", { value: 0 }] }])
})

afterAll(async () => {
    await db.delete("Salesman", [{ function: ">", params: ["id", { value: 0 }] }])
    await db.close();
});

describe("Identification", () => {
    test("should reissue when old identification is expired", async () => {

        const validTo = new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString();
        await db.insert("Identification", [{
            salesman: salesmanId,
            id_nr: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            validTo
        }])

        const id = await getNewID(salesmanId, db as DataSource<typeof tables, SelectFunctionDefinitions>);
        expect(id).toBeDefined();
        expect(id.id_nr).toBe(1);

        const res = await db.find("Identification", {
            where: [{ function: "=", params: ["id", { value: id.id }] },
            { function: ">", params: ["validTo", { value: validTo }] }]
        });
        expect(res?.[0]?.id).toBe(id.id);
    });

    test("should update validTo when old identification is not expired long enough", async () => {

        await db.insert("Identification", [{
            salesman: salesmanId,
            id_nr: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            validTo: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString(),
        }])

        const id = await getNewID(salesmanId, db as DataSource<typeof tables, SelectFunctionDefinitions>);
        expect(id).toBeDefined();

        expect(id.id_nr).toBe(1);
    });

    test("should use new ID when already taken by another salesman and valid ", async () => {

        await db.insert("Identification", [{
            salesman: otherSalesmanId,
            id_nr: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            validTo: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString(),
        }])

        const id = await getNewID(salesmanId, db as DataSource<typeof tables, SelectFunctionDefinitions>);
        expect(id).toBeDefined();

        expect(id.id_nr).toBe(2);
    });

    test("should reuse of someone else if no longer valid ", async () => {

        await db.insert("Identification", [{
            salesman: otherSalesmanId,
            id_nr: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            validTo: new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString(),
        }])

        const id = await getNewID(salesmanId, db as DataSource<typeof tables, SelectFunctionDefinitions>);
        expect(id).toBeDefined();

        expect(id.id_nr).toBe(1);
    });

    test("should get the next free id", async () => {


        await db.insert("Identification", [{
            salesman: otherSalesmanId,
            id_nr: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            validTo: new Date().toISOString(),
        }])

        const id = await getNewID(salesmanId, db as DataSource<typeof tables, SelectFunctionDefinitions>);
        expect(id).toBeDefined();

        expect(id.id_nr).toBe(2);
    });
});