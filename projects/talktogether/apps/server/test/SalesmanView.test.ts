import { beforeAll, describe, expect, test } from "vitest";
import { app } from "../app";

beforeAll(async () => {
    await app.start();
});

describe("SalesmanView", () => {
    test("should return the correct salesmen", async () => {
        const db = app.getModule("db");
        const res = await db.find("Salesman", {});
        expect(res).toBeDefined();
    });
});