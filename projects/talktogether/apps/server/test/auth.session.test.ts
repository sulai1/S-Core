import bcrypt from "bcrypt";
import supertest from "supertest";
import { beforeEach, describe, expect, test, vi } from "vitest";

let capturedServer: { app: unknown } | undefined;

vi.mock("../app", () => ({
    imgPath: "C:/tmp/talktogether-test-images"
}));

vi.mock("@s-core/server", async () => {
    const actual = await vi.importActual<typeof import("@s-core/server")>("@s-core/server");
    return {
        ...actual,
        createServer: () => {
            const server = actual.createServer();
            capturedServer = server as unknown as { app: unknown };
            return server;
        },
        createDatasourceServer: () => ({}),
        createFileServerModule: () => ({})
    };
});

import { serverFactory } from "../src/serverFactory";

describe("talktogether auth session", () => {
    beforeEach(() => {
        capturedServer = undefined;
    });

    test("should persist session across multiple requests after login", async () => {
        const password = "secret-password";
        const hashedPassword = await bcrypt.hash(password, 4);

        const db = {
            find: vi.fn(async (table: string) => {
                if (table !== "User") {
                    return [];
                }
                return [{
                    id: 42,
                    email: "jane@example.com",
                    firstName: "Jane",
                    lastName: "Doe",
                    password: hashedPassword
                }];
            })
        };

        const provider = {
            getModule: vi.fn(() => db),
            on: vi.fn()
        };

        await serverFactory(provider as never);

        if (!capturedServer) {
            throw new Error("Expected serverFactory to create a server instance");
        }

        const agent = supertest.agent(capturedServer.app as Parameters<typeof supertest.agent>[0]);

        // First verify session is NOT authenticated before login
        const sessionBeforeLogin = await agent.get("/auth/session");
        expect(sessionBeforeLogin.status).toBe(200);
        expect(sessionBeforeLogin.body).toEqual({
            authenticated: false
        });

        // Login and verify session cookie is set
        const loginRes = await agent
            .post("/auth/login")
            .set("Content-Type", "application/json")
            .send({ email: "jane@example.com", password });

        expect(loginRes.status).toBe(200);
        expect(loginRes.body).toMatchObject({
            success: true,
            user: {
                id: 42,
                email: "jane@example.com"
            }
        });

        // Verify Set-Cookie header is present
        expect(loginRes.headers["set-cookie"]).toBeDefined();
        const sessionCookie = loginRes.headers["set-cookie"];
        expect(Array.isArray(sessionCookie)).toBe(true);
        expect(sessionCookie[0]).toMatch(/connect\.sid=/);

        // First session check - should be authenticated
        const sessionRes = await agent.get("/auth/session");

        expect(sessionRes.status).toBe(200);
        expect(sessionRes.body).toEqual({
            authenticated: true,
            user: {
                id: 42,
                email: "jane@example.com"
            }
        });

        // Second session check - should STILL be authenticated (proving persistence)
        const sessionRes2 = await agent.get("/auth/session");

        expect(sessionRes2.status).toBe(200);
        expect(sessionRes2.body).toEqual({
            authenticated: true,
            user: {
                id: 42,
                email: "jane@example.com"
            }
        });

        // Third session check - verify it persists across even more requests
        const sessionRes3 = await agent.get("/auth/session");

        expect(sessionRes3.status).toBe(200);
        expect(sessionRes3.body).toEqual({
            authenticated: true,
            user: {
                id: 42,
                email: "jane@example.com"
            }
        });

        // Verify db.find was only called once during login, not on every session check
        expect(db.find).toHaveBeenCalledTimes(1);
        expect(db.find).toHaveBeenCalledWith("User", expect.any(Object));
    });

    test("should NOT authenticate requests without session cookie", async () => {
        const password = "secret-password";
        const hashedPassword = await bcrypt.hash(password, 4);

        const db = {
            find: vi.fn(async (table: string) => {
                if (table !== "User") {
                    return [];
                }
                return [{
                    id: 42,
                    email: "jane@example.com",
                    firstName: "Jane",
                    lastName: "Doe",
                    password: hashedPassword
                }];
            })
        };

        const provider = {
            getModule: vi.fn(() => db),
            on: vi.fn()
        };

        await serverFactory(provider as never);

        if (!capturedServer) {
            throw new Error("Expected serverFactory to create a server instance");
        }

        // Use agent to login
        const agent = supertest.agent(capturedServer.app as Parameters<typeof supertest.agent>[0]);

        const loginRes = await agent
            .post("/auth/login")
            .set("Content-Type", "application/json")
            .send({ email: "jane@example.com", password });

        expect(loginRes.status).toBe(200);

        // Verify session is authenticated with the agent (has cookie)
        const sessionWithCookie = await agent.get("/auth/session");
        expect(sessionWithCookie.body.authenticated).toBe(true);

        // Now make a request WITHOUT the session cookie using a plain supertest request
        const sessionWithoutCookie = await supertest(capturedServer.app as Parameters<typeof supertest>[0])
            .get("/auth/session");

        expect(sessionWithoutCookie.status).toBe(200);
        expect(sessionWithoutCookie.body).toEqual({
            authenticated: false
        });
    });
});
