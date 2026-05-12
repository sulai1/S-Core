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

        const query = qs.from({
            s: "Salesman"
        }).lateralFrom("i", { ident: "Identification" }, (from) =>
            from
                .select({
                    id: "ident.id_nr",
                    name: "ident.salesman",
                    createdAt: "ident.createdAt"
                })
                .where(e => e.fn("=", e.col("ident.salesman"), e.col("ident.id_nr")))
        ).select({
            id: "s.id"
        }).orderBy("s.id")
            .limit(1).build();

        const res = await db.query(query);
        const id: number = res[0].id;

        expect(id).toBe(1);

        expect(query).toBeDefined();
    })
});