import { beforeAll, describe, expect, test } from "vitest";
import { appCollection } from "../app";

beforeAll(async () => {
    await appCollection.start();
});

describe("SalesmanView", () => {
    test("should return the correct salesmen", async () => {
        const db = appCollection.getModule("db");
        const res = await db.find("Salesman", {});
        expect(res).toBeDefined();
    });
});