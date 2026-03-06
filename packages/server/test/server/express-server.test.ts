// eslint-disable-next-line @typescript-eslint/no-explicit-any
import supertest from "supertest";
import { describe, expect, test, vi } from "vitest";
import { ExpressServer } from "../../src/server/ExpressServer";
import { createServer } from "../../src";

const server = new ExpressServer();
const app = server.app;

const newServer = server.use("/test/a", async (req, res) => {
    res.status(200).json({ a: 1 });
}).use("/test/b", async (req, res) => {
    res.status(201).json({});
});

describe("Server API routes", () => {
    test("GET /test/a should return { a: 1 }", async () => {
        const res = await supertest(app).get("/test/a");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ a: 1 });
        expect(res.headers["content-type"]).toMatch(/application\/json/);
    });

    test("POST /test/b should return {}", async () => {
        const res = await supertest(app).post("/test/b").send({});
        expect(res.status).toBe(201);
        expect(res.body).toEqual({});
        expect(res.headers["content-type"]).toMatch(/application\/json/);
    });

    test("GET /unknown should return 404", async () => {
        const res = await supertest(app).get("/unknown");
        expect(res.status).toBe(404);
    });
    test("Extended server should have correct types", async () => {
        const extendedServer = newServer.extend<{ user: string }>(
            "/user",
            async (req, res) => {
                return {
                    user
                        : "test-user"
                };
            }
        );
    });
    test("use createServer and listen", async () => {
        const server = createServer();
        expect(server).toBeInstanceOf(ExpressServer);
        const fn = vi.fn((port:number, cb: () => void) => cb());
        ((server as ExpressServer).app.listen as any) = fn;
        await server.listen(3000);
        expect(fn).toHaveBeenCalledWith(3000, expect.any(Function));
    });
});