import type { Client, FilePaths } from "@s-core/core";
import { createFileSchema, HttpResponse } from "@s-core/core";
import { promises as fs } from "fs";
import { AddressInfo } from "net";
import os from "os";
import path from "path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { ExpressServer } from "../../src/server/ExpressServer.js";
import { createFileServerModule } from "../../src/server/createFileServerModule.js";
import { createFileClient } from "@s-core/client";

type Fetch = (input: string, init?: unknown) => Promise<{
    status: number;
    statusText: string;
    arrayBuffer: () => Promise<ArrayBuffer>;
    json: () => Promise<unknown>;
}>;

function createFetchClient(baseURL: string): Client {
    const doFetch = (globalThis as unknown as { fetch?: Fetch }).fetch;
    if (!doFetch) {
        throw new Error("global fetch is not available");
    }

    const joinUrl = (base: string, url: string) => {
        const trimmedBase = base.replace(/\/+$/, "");
        const trimmedUrl = url.startsWith("/") ? url : `/${url}`;
        return `${trimmedBase}${trimmedUrl}`;
    };

    const request = async (method: string, url: string, body?: unknown, options?: { headers?: Record<string, string | string[] | undefined>; responseType?: string }) => {
        const headers: Record<string, string> = {};
        if (options?.headers) {
            for (const [key, value] of Object.entries(options.headers)) {
                if (typeof value === "string") {
                    headers[key] = value;
                }
            }
        }

        const isFormData = body && typeof body === "object" && "append" in (body as object);
        const finalBody = isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined;
        if (!isFormData && finalBody) {
            headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
        }

        const res = await doFetch(joinUrl(baseURL, url), {
            method,
            headers,
            body: finalBody as BodyInit | undefined
        } as RequestInit);

        if (options?.responseType === "arraybuffer") {
            const buf = Buffer.from(await res.arrayBuffer());
            return { status: res.status, statusText: res.statusText, data: buf };
        }

        const data = await res.json();
        return { status: res.status, statusText: res.statusText, data };
    };

    return {
        get: <R>(url: string, options?: { headers?: Record<string, string | string[] | undefined>; responseType?: string }) => request("GET", url, undefined, options) as Promise<HttpResponse<R>>,
        post: <R>(url: string, data?: unknown, options?: { headers?: Record<string, string | string[] | undefined>; responseType?: string }) => request("POST", url, data, options) as Promise<HttpResponse<R>>,
        put: <R>(url: string, data?: unknown, options?: { headers?: Record<string, string | string[] | undefined>; responseType?: string }) => request("PUT", url, data, options) as Promise<HttpResponse<R>>,
        patch: <R>(url: string, data?: unknown, options?: { headers?: Record<string, string | string[] | undefined>; responseType?: string }) => request("PATCH", url, data, options) as Promise<HttpResponse<R>>,
        delete: <R>(url: string, options?: { headers?: Record<string, string | string[] | undefined>; responseType?: string }) => request("DELETE", url, undefined, options) as Promise<HttpResponse<R>>,
        head: <R>(url: string, options?: { headers?: Record<string, string | string[] | undefined>; responseType?: string }) => request("HEAD", url, undefined, options) as Promise<HttpResponse<R>>
    };
}

describe("file module - server and client", () => {
    let server: ExpressServer;
    let httpServer: import("http").Server;
    let baseURL: string;
    let uploadDir: string;

    beforeAll(async () => {
        uploadDir = await fs.mkdtemp(path.join(os.tmpdir(), "file-module-"));
        server = new ExpressServer();

        await server.add<FilePaths<"/files">>(
            "/",
            createFileSchema("/files"),
            createFileServerModule("/files", uploadDir),
            { validateRequests: false, validateResponses: false }
        );

        server.useErrorHandler((err, _req, res, _next) => {
            res.status(500).json({ message: err?.message ?? "Internal Server Error" });
        });

        httpServer = server.app.listen(0);
        const address = httpServer.address() as AddressInfo;
        baseURL = `http://127.0.0.1:${address.port}`;
    });

    afterAll(async () => {
        if (httpServer) {
            await new Promise<void>((resolve) => httpServer.close(() => resolve()));
        }
        try {
            const files = await fs.readdir(uploadDir);
            await Promise.all(files.map((file) => fs.unlink(path.join(uploadDir, file))));
            await fs.rmdir(uploadDir);
        } catch {
            // ignore cleanup errors
        }
    });

    test("client can upload and download files", async () => {
        const form = new (globalThis as unknown as { FormData: new () => { append: (name: string, value: unknown, fileName?: string) => void } }).FormData();
        const blob = new (globalThis as unknown as { Blob: new (parts: unknown[]) => unknown }).Blob(["hello world"]);
        form.append("files", blob, "hello.txt");

        const fileClient = createFileClient(baseURL, { client: createFetchClient(baseURL), basePath: "/files" });
        const uploadRes = await fileClient.upload(form);

        expect(uploadRes.length).toBe(1);
        expect(uploadRes[0].filename).toBe("hello.txt");
        expect(uploadRes[0].size).toBeDefined();

        const downloaded = await fileClient.download("hello.txt", { responseType: "arraybuffer" });
        expect(Buffer.isBuffer(downloaded)).toBe(true);
        expect((downloaded as Buffer).toString()).toBe("hello world");
    });
});
