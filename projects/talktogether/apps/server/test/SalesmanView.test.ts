import { beforeAll, describe, expect, test } from "vitest";
import { appCollection } from "../app";
import { QuerySerializer, selectFunctionDefinitions, SelectFunctionDefinitions, SerializedQuery } from "@s-core/core";
import { tables } from "@s-core/talktogether";

let app: Awaited<ReturnType<typeof appCollection.build>>;

beforeAll(async () => {
    app = await appCollection.build();
    app.start();
});

describe("SalesmanView", () => {
    test("should return the correct salesmen", async () => {
        const db = app.getModule("db");
        const res = await db.find("Salesman", {});
        expect(res).toBeDefined();
    });
    test("serialize query", async () => {
        const db = app.getModule("db");
        const qs = new QuerySerializer(tables, selectFunctionDefinitions);

        const identificationSubQuery: SerializedQuery = qs.from({
            i: "Identification",
        }).select({
            id: "i.id_nr",
            name: "i.salesman",
            createdAt: "i.createdAt"
        }).where(e => { e.fn("=", "i.salesman", "i.id_nr") }).build();

        const query = qs.from({
            s: "Salesman",
            i: {
                lateral: true,
                query: identificationSubQuery,
            }
        }).build();

        expect(query).toBeDefined();
    })
});