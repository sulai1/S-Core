import path from "node:path";
import { fileURLToPath } from "node:url";
import RefParser from "@apidevtools/json-schema-ref-parser";
import { createServer } from "@s-core/server";
import { OpenAPIV3_1 } from "openapi-types";
import supertest from "supertest";
import { describe, expect, test } from "vitest";
import { Application } from "express";
import type { paths } from "../src/server/api/index.js";
import { audioGrabberModule } from "../src/server/module.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.resolve(__dirname, "../src/server/api/schema.yaml");
type RequestClient = ReturnType<typeof supertest>;

async function createApp(): Promise<Application> {
    const server = createServer();
    const schema = await RefParser.bundle<OpenAPIV3_1.Document>(schemaPath);
    server.add<paths>("/api", schema, audioGrabberModule, {
        validateRequests: true,
        validateResponses: false,
    });

    return (server as unknown as { app: Application }).app;
}

async function pollJobStatus(
    request: RequestClient,
    jobId: string,
): Promise<"queued" | "running" | "success" | "failed"> {
    let state: "queued" | "running" | "success" | "failed" = "queued";

    for (let index = 0; index < 15; index += 1) {
        const res = await request.get(`/api/jobs/${jobId}`);
        expect(res.status).toBe(200);
        state = res.body.state as "queued" | "running" | "success" | "failed";
        if (state === "success" || state === "failed") {
            return state;
        }
        await new Promise((resolve) => setTimeout(resolve, 20));
    }

    return state;
}

describe("AudioGrabber API lifecycle", () => {
    test("queues download and eventually reaches terminal state", async () => {
        const app = await createApp();
        const request = supertest(app);

        const queued = await request
            .post("/api/jobs/download")
            .send({ videoId: "video-123", priority: 5 })
            .set("Content-Type", "application/json");

        expect(queued.status).toBe(202);
        expect(queued.body.state).toBe("queued");
        expect(typeof queued.body.jobId).toBe("string");

        const finalState = await pollJobStatus(request, queued.body.jobId as string);
        expect(["success", "failed"]).toContain(finalState);
    });

    test("queues channel sync and returns queued state", async () => {
        const app = await createApp();
        const request = supertest(app);

        const queued = await request
            .post("/api/sync/channels/channel-abc")
            .send({ maxResults: 100 })
            .set("Content-Type", "application/json");

        expect(queued.status).toBe(202);
        expect(queued.body.state).toBe("queued");
        expect(queued.body.channelId).toBe("channel-abc");
    });

    test("lists library videos", async () => {
        const app = await createApp();
        const request = supertest(app);

        const res = await request.get("/api/library/videos?limit=10");

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.items)).toBe(true);
        expect(res.body.items.length).toBeGreaterThan(0);
    });
});
