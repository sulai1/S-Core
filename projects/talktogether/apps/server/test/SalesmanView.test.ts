import { beforeAll, describe, expect, test } from "vitest";
import { appCollection } from "../app";

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
});