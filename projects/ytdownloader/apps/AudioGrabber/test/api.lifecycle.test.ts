import path from "node:path";
import { fileURLToPath } from "node:url";
import RefParser from "@apidevtools/json-schema-ref-parser";
import { createServer } from "@s-core/server";
import { OpenAPIV3_1 } from "openapi-types";
import supertest from "supertest";
import { afterEach, describe, expect, test, vi } from "vitest";
import { Application } from "express";
import type { paths } from "../src/server/api/index.js";
import { audioGrabberModule } from "../src/server/module.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.resolve(__dirname, "../src/server/api/schema.yaml");
type RequestClient = ReturnType<typeof supertest>;

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete process.env.AUDIOGRABBER_YT_API_KEY;
});

async function createApp(): Promise<Application> {
    const server = createServer();
    const schema = await RefParser.bundle<OpenAPIV3_1.Document>(schemaPath);
    server.add<paths>("/api", schema, audioGrabberModule, {
        validateRequests: true,
        validateResponses: false,
    });
    server.useErrorHandler((err, _req, res) => {
        const status = typeof err?.status === "number" ? err.status : 500;
        const error = typeof err?.error === "string" ? err.error : "Internal Server Error";
        const details = typeof err?.details === "string" ? err.details : "Unexpected error";
        res.status(status).json({ error, details });
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
        for (const item of res.body.items) {
            expect(typeof item.id).toBe("string");
            expect(typeof item.title).toBe("string");
            expect(item.status).toBe("ready");
        }
    });

    test("returns 400 for invalid download payload", async () => {
        const app = await createApp();
        const request = supertest(app);

        const missingVideo = await request
            .post("/api/jobs/download")
            .send({ priority: 5 })
            .set("Content-Type", "application/json");

        expect(missingVideo.status).toBe(400);

        const invalidPriority = await request
            .post("/api/jobs/download")
            .send({ videoId: "video-123", priority: 999 })
            .set("Content-Type", "application/json");

        expect(invalidPriority.status).toBe(400);
    });

    test("returns 404 contract for missing job", async () => {
        const app = await createApp();
        const request = supertest(app);

        const res = await request.get("/api/jobs/non-existing-job");

        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Job not found");
    });

    test("extracts metadata from watch page music shelf fallback", async () => {
        process.env.AUDIOGRABBER_YT_API_KEY = "test-api-key";

        const watchPageHtml = [
            '<yt-video-attribute-view-model>',
            '<h1 class="ytVideoAttributeViewModelTitle">Derm4T3Tris (Original Mix)</h1>',
            '<h4 class="ytVideoAttributeViewModelSubtitle"><span>Delirium Tremens, Cocodrilo</span></h4>',
            '<span class="ytVideoAttributeViewModelSecondarySubtitle"><span class="ytAttributedStringHost" role="text">Auryn</span></span>',
            '</yt-video-attribute-view-model>',
        ].join("\n");

        vi.stubGlobal("fetch", vi.fn(async (input: unknown) => {
            const requestUrl = typeof input === "string" ? input : String(input);
            const parsed = new URL(requestUrl);
            const pathname = parsed.pathname;

            if (pathname.endsWith("/search")) {
                return new Response(JSON.stringify({
                    items: [{ snippet: { channelId: "UC_TEST_CHANNEL" } }],
                }), { status: 200, headers: { "content-type": "application/json" } });
            }

            if (pathname.endsWith("/channels")) {
                return new Response(JSON.stringify({
                    items: [{
                        id: "UC_TEST_CHANNEL",
                        snippet: { title: "Test Channel", description: "desc" },
                        contentDetails: { relatedPlaylists: { uploads: "UU_TEST_UPLOADS" } },
                        statistics: { videoCount: "1" },
                    }],
                }), { status: 200, headers: { "content-type": "application/json" } });
            }

            if (pathname.endsWith("/playlistItems")) {
                return new Response(JSON.stringify({
                    items: [{
                        snippet: {
                            publishedAt: "2024-01-01T00:00:00Z",
                            title: "fallback title",
                            thumbnails: { medium: { url: "https://example.com/thumb.jpg" } },
                            resourceId: { videoId: "abc123xyz99" },
                        },
                    }],
                }), { status: 200, headers: { "content-type": "application/json" } });
            }

            if (pathname.endsWith("/videos")) {
                return new Response(JSON.stringify({
                    items: [{
                        id: "abc123xyz99",
                        snippet: {
                            title: "Random upload title",
                            description: "Cocodrilo - Auryn IS OUT NOW",
                            tags: ["tag1"],
                        },
                        contentDetails: { duration: "PT3M15S" },
                        statistics: { viewCount: "42", likeCount: "7" },
                    }],
                }), { status: 200, headers: { "content-type": "application/json" } });
            }

            if (pathname === "/watch") {
                return new Response(watchPageHtml, {
                    status: 200,
                    headers: { "content-type": "text/html" },
                });
            }

            return new Response(JSON.stringify({ items: [] }), {
                status: 404,
                headers: { "content-type": "application/json" },
            });
        }));

        const app = await createApp();
        const request = supertest(app);

        const res = await request.get("/api/channels/overview?channel=@purplehexagonrecords3907&maxResults=1");

        expect(res.status).toBe(200);
        expect(res.body.videos).toHaveLength(1);
        expect(res.body.videos[0].songTitle).toBe("Derm4T3Tris (Original Mix)");
        expect(res.body.videos[0].artist).toBe("Delirium Tremens, Cocodrilo");
        expect(res.body.videos[0].album).toBe("Auryn");
    });

});
