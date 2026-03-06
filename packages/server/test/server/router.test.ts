// eslint-disable-next-line @typescript-eslint/no-explicit-any
import express from "express";
import supertest from "supertest";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { OpenApiModule } from "@s-core/core";
import { ExpressServer } from "../../src/server/ExpressServer.js";
import * as api from "../api/test-api-permanent/index.js";
import { OpenApiMethod, OpenApiResult } from "@s-core/core";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.join(__dirname, "../api/test-api-permanent/schema.yaml");


let server: ExpressServer;
beforeEach(() => {
    server = new ExpressServer();
});

const apiRes: OpenApiResult<api.paths, "/pathWithRequestBody", "post"> = { id: "123", message: "Test" };
const met: OpenApiMethod<api.paths, "/pathWithRequestBody", "post"> = async () => ({ id: "123", message: "Test" });

const t = {
    "/pathWithMultipleStatusCodes": {
        get: vi.fn(),
    },
    "/pathWithParameters/{param1}": {
        get: vi.fn(),
    },
    "/pathWithQueryParameters": {
        get: vi.fn(),
    },
    "/pathWithRequestBody": {
        post: vi.fn(),
    },
    "/pathWithEverything": {
        put: vi.fn(),
    },
    "/pathWithFormUrlEncoded": {
        post: vi.fn(),
    },
    "/pathWithMultipart": {
        post: vi.fn(),
    },
    "/pathWithOctetStream": {
        post: vi.fn(),
    },
    "/pathWithPdfBody": {
        post: vi.fn(),
    },
    "/pathWithTextBody": {
        post: vi.fn(),
    }
} satisfies OpenApiModule<api.paths, express.Request>;

describe("Server API routes", () => {
    test.for([
        {
            name: "multer file", path: "/pathWithMultipart", method: "post", status: 200, contentType: "multipart/form-data",
            request: {
                fieldname: "file", originalname: "test.txt", encoding: "7-bit", mimetype: "text/plain", buffer: Buffer.from("file content"), size: 12
            },
            response: { message: "Multipart received fileField: undefined, textField: undefined " },
        }
    ] as { name: string, path: string, method: string, request: any, response: any, status: number, contentType: string }[]
    )(
        "$name",
        async (testCase) => {

            (t as any)[testCase.path][testCase.method].mockResolvedValue(testCase.response);
            await server.add<api.paths>(
                "/test",
                schemaPath,
                t,
                { validateRequests: true, validateResponses: false });
            const mock = supertest(server.app);
            let reqBuilder = (mock as any)[testCase.method]("/test" + testCase.path);
            if (testCase.contentType === "multipart/form-data") {
                // Attach file
                reqBuilder = reqBuilder.attach(
                    testCase.request.fieldname || "file",
                    testCase.request.buffer,
                    testCase.request.originalname || "test.txt"
                );
                // Add other fields if needed - add textField for test
                reqBuilder = reqBuilder.field('description', 'desc');
            } else {
                reqBuilder = reqBuilder.send(testCase.request).set('Content-Type', testCase.contentType);
            }
            const res = await reqBuilder;
            expect(res.status).toBe(200);
            expect((t as any)[testCase.path as keyof api.paths][testCase.method])
                .toHaveBeenCalled();
        }
    )
    test("should reach routes added via use()", async () => {
        const f = vi.fn((req, res) => {
            res.status(200).json({ message: "Hello, world!" });
        });
        server.use("/hello", f);

        const res = await supertest(server.app).get("/hello");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: "Hello, world!" });
        expect(res.headers["content-type"]).toMatch(/application\/json/);
        expect(f).toHaveBeenCalled();
    });

    test("test attribute should be available in extension", async () => {
        const newServer = server.extend<{ test: string }>("/test", async (req, res) => {
            return { test: "test" };
        });
        const f = vi.fn((req, res) => {
            expect(req.test).toBe("test");
            res.status(200).json({ a: 1 });
        })
        newServer.use("/", f);

        const res = await supertest(server.app).get("/test");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ a: 1 });
        expect(res.headers["content-type"]).toMatch(/application\/json/);
        expect(f).toHaveBeenCalled();
    });

    test("should add api routes", async () => {
        t["/pathWithMultipleStatusCodes"].get.mockResolvedValue({ id: "123", name: "Test" });
        await server.add<api.paths>(
            "/test",
            schemaPath,
            t,
            { validateRequests: true, validateResponses: true });
        const mock = supertest(server.app)

        // Test route with multiple status codes
        let res = await mock.get("/test/pathWithMultipleStatusCodes");
        expect(res.status).toBe(200);
        expect(t["/pathWithMultipleStatusCodes"].get).toHaveBeenCalled();

        // Test route with query parameters
        res = await mock.get("/test/pathWithQueryParameters")
            .query({ queryParam1: "value1", queryParam2: "value2" });
        expect(res.status).toBe(200);
        expect(t["/pathWithQueryParameters"].get).toHaveBeenCalled();

        // Test route with path parameters
        res = await mock.get("/test/pathWithParameters/paramValue");
        expect(res.status).toBe(200);
        expect(t["/pathWithParameters/{param1}"].get).toHaveBeenCalled();

        // Test route with request body
        res = await mock
            .post("/test/pathWithRequestBody")
            .send({ data: "Sample Data" })
            .set('Content-Type', 'application/json');
        expect(res.status).toBe(201);
        expect(t["/pathWithRequestBody"].post).toHaveBeenCalled();

        // Test route with text/plain body
        t["/pathWithTextBody"].post.mockResolvedValue("Hello, plain text!");
        res = await mock
            .post("/test/pathWithTextBody")
            .send("Hello, plain text!")
            .set('Content-Type', 'text/plain');
        expect(res.status).toBe(200);
        expect(t["/pathWithTextBody"].post).toHaveBeenCalled();

        // Test route with application/pdf body (send a Buffer)
        const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46]); // '%PDF' header
        res = await mock
            .post("/test/pathWithPdfBody")
            .send(pdfBuffer)
            .set('Content-Type', 'application/pdf');
        expect(res.status).toBe(200);
        expect(t["/pathWithPdfBody"].post).toHaveBeenCalled();

        // Test route with application/x-www-form-urlencoded
        res = await mock
            .post("/test/pathWithFormUrlEncoded")
            .send('field1=foo&field2=42')
            .set('Content-Type', 'application/x-www-form-urlencoded');
        expect(res.status).toBe(200);
        expect(t["/pathWithFormUrlEncoded"].post).toHaveBeenCalled();

        // Test route with multipart/form-data
        res = await mock
            .post("/test/pathWithMultipart")
            .field('description', 'desc')
            .attach('file', Buffer.from('filecontent'), 'test.txt');
        expect(res.status).toBe(200);
        expect(t["/pathWithMultipart"].post).toHaveBeenCalled();

        // Test route with application/octet-stream (send a Buffer)
        const octetBuffer = Buffer.from([1, 2, 3, 4]);
        res = await mock
            .post("/test/pathWithOctetStream")
            .send(octetBuffer)
            .set('Content-Type', 'application/octet-stream');
        expect(res.status).toBe(200);
        expect(t["/pathWithOctetStream"].post).toHaveBeenCalled();
    });
});