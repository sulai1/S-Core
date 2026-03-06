import { Repository, SelectFunctionDefinitions, selectFunctionDefinitions, TableSchema } from "@s-core/core";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { Database, PostgreDialect } from "../../../src/database/";

const CrudModelSchema = {
    name: "CRUDModel",
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: true,
        },
        name: {
            type: String,
        },
        date: {
            type: Date,
        },
        createdAt: {
            type: Date,
            generated: "createdAt",
        },
        updatedAt: {
            type: Date,
            generated: "updatedAt",
        },
    },
} as const satisfies TableSchema;

const db = new Database({
    database: "test",
    host:  process.env.DB_HOST,
    user: "postgres",
    password: process.env.DB_PASSWORD,
    synchronize: true,
    functions: selectFunctionDefinitions,
    tables: { CRUDModel: CrudModelSchema },
    dialect: new PostgreDialect(),
});
let repository: Repository<typeof CrudModelSchema, SelectFunctionDefinitions>;
beforeAll(async () => {
    await db.connect();
    repository = db.createRepository("CRUDModel");
});

afterAll(async () => {
    await db.close();
});

beforeEach(async () => {
    await repository.create({ date: "2024-01-01", name: "test1", id: 1 });
});

afterEach(async () => {
    await db.delete("CRUDModel", []);
});

describe("CRUD Tests", () => {
    test("Should create a new row", async () => {
        const res = await db.insert("CRUDModel", [{ date: "2024-01-04", name: "test4" }]);
        expect(res[0]).toBeDefined();
        const retrieved = await db.find("CRUDModel", {
            attributes: {
                id: "id",
                date: "date",
                name: "name",
                createdAt: "createdAt",
                updatedAt: "updatedAt"
            },
            where: [{ function: "=", params: ["name", { value: "test4" }] }]
        });
        const model = retrieved[0];
        expect(model.name).toBe("test4");
        expect(model.createdAt).toBeDefined();
        expect(model.updatedAt).toBeDefined();
        if (typeof model.date === "string") {
            expect(new Date(model.date).toISOString()).toBe(new Date("2024-01-04").toISOString());
        }
    });

    test("it should update a row", async () => {
        await db.update("CRUDModel",
            {
                id: 1,
                date: "2024-01-05",
                name: "test5"
            },
            [{ function: "=", params: ["id", { value: 1 }] }]
        );
        const retrieved = await db.find("CRUDModel", {
            attributes: {
                id: "id",
                date: "date",
                name: "name",
                createdAt: "createdAt",
                updatedAt: "updatedAt"
            },
            where: [{ function: "=", params: ["id", { value: 1 }] }]
        });
        const model = retrieved[0];
        expect(model.name).toBe("test5");
        if (typeof model.date === "string") {
            expect(new Date(model.date).toISOString()).toBe(new Date("2024-01-05").toISOString());
        }
    });

    test("it should bulk update rows", async () => {
        await db.update("CRUDModel",
            {
                id: 1,
                name: "false",
            },
            [{ function: "=", params: ["name", { value: "test1" }] }]
        )
        const retrieved = await db.find("CRUDModel", {
            attributes: {
                id: "id",
                date: "date",
                name: "name",
                createdAt: "createdAt",
                updatedAt: "updatedAt"
            },
            where: [{ function: "=", params: ["name", { value: "false" }] }]
        });
        expect(retrieved.length).toBe(1);
    });

    test("it should delete a row", async () => {
        const res = await db.delete("CRUDModel", [{ function: "=", params: ["id", { value: 1 }] }]);
        const retrieved = await db.find("CRUDModel", {
            attributes: {
                id: "id",
                date: "date",
                name: "name",
                createdAt: "createdAt",
                updatedAt: "updatedAt"
            },
            where: [{ function: "=", params: ["id", { value: 1 }] }]
        });
        expect(retrieved.length).toBe(0);
    });

    test("it should bulk delete rows", async () => {
        const res = await db.delete("CRUDModel", [{ function: "=", params: ["name", { value: "test1" }] }]);
        const retrieved = await db.find("CRUDModel", {
            attributes: {
                id: "id",
                date: "date",
                name: "name",
                createdAt: "createdAt",
                updatedAt: "updatedAt"
            },
            where: [{ function: "=", params: ["name", { value: "true" }] }]
        });
        expect(retrieved.length).toBe(0);
    });

});