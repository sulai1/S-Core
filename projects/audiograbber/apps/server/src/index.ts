import "reflect-metadata";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "@s-core/server";
import nodeID3 from "node-id3";
import { createAudioGrabberModule } from "./server/module.js";
import { AppDataSource } from "./data-source.js";
import { createAuthMiddleware } from "./server/auth.js";
import { AUDIOGRABBER_DOWNLOAD_FOLDER } from "./server/storagePaths.js";
import type { paths } from "./server/api/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiSchema = path.resolve(__dirname, "./server/api/schema.yaml");
const port = Number(process.env.PORT || 3800);

let lifecycleHooksRegistered = false;

function describeActiveHandles(): string[] {
    const processWithInternals = process as unknown as {
        _getActiveHandles?: () => unknown[];
    };
    const handles = processWithInternals._getActiveHandles?.() ?? [];
    return handles.map((handle) => {
        const name = (handle as { constructor?: { name?: string } })?.constructor?.name;
        return name && name.length > 0 ? name : "UnknownHandle";
    });
}

function registerLifecycleDiagnostics(): void {
    if (lifecycleHooksRegistered) {
        return;
    }
    lifecycleHooksRegistered = true;

    process.on("beforeExit", (code) => {
        const handles = describeActiveHandles();
        console.error(`[${new Date().toISOString()}] Process beforeExit(${code}) with ${handles.length} active handle(s): ${handles.join(", ") || "none"}`);
        console.error("  Server process is leaving the event loop. This usually means no listener/timer/socket is still referenced.");
    });

    process.on("exit", (code) => {
        console.error(`[${new Date().toISOString()}] Process exit(${code})`);
    });

    process.on("uncaughtException", (error) => {
        console.error(`[${new Date().toISOString()}] Uncaught exception`, error);
    });

    process.on("unhandledRejection", (reason) => {
        console.error(`[${new Date().toISOString()}] Unhandled promise rejection`, reason);
    });
}

function findLibraryMediaByVideoId(videoId: string): string | undefined {
    if (!existsSync(AUDIOGRABBER_DOWNLOAD_FOLDER)) {
        return undefined;
    }

    const mediaExt = new Set([".mp3", ".m4a", ".mp4", ".webm"]);
    const matched = readdirSync(AUDIOGRABBER_DOWNLOAD_FOLDER)
        .filter((fileName) => fileName.includes(videoId))
        .filter((fileName) => mediaExt.has(path.extname(fileName).toLowerCase()))
        .sort((a, b) => a.localeCompare(b));

    if (matched.length === 0) {
        return undefined;
    }

    return path.join(AUDIOGRABBER_DOWNLOAD_FOLDER, matched[0]);
}

function findSidecarThumbnailByVideoId(videoId: string): string | undefined {
    if (!existsSync(AUDIOGRABBER_DOWNLOAD_FOLDER)) {
        return undefined;
    }

    const thumbnailExt = new Set([".jpg", ".jpeg", ".png", ".webp"]);
    const matched = readdirSync(AUDIOGRABBER_DOWNLOAD_FOLDER)
        .filter((fileName) => fileName.includes(videoId))
        .filter((fileName) => thumbnailExt.has(path.extname(fileName).toLowerCase()))
        .sort((a, b) => a.localeCompare(b));

    if (matched.length === 0) {
        return undefined;
    }

    return path.join(AUDIOGRABBER_DOWNLOAD_FOLDER, matched[0]);
}

function toImageMimeFromExtension(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === ".png") {
        return "image/png";
    }
    if (ext === ".webp") {
        return "image/webp";
    }
    return "image/jpeg";
}

function validateStartupEnv(): void {
    const workerMode = (process.env.AUDIOGRABBER_WORKER_MODE ?? "ytdlp").toLowerCase();
    if (workerMode !== "python") {
        return;
    }

    const apiKey = (process.env.AUDIOGRABBER_YT_API_KEY ?? "").trim();
    if (!apiKey) {
        throw new Error("Missing required AUDIOGRABBER_YT_API_KEY for python worker mode.");
    }
}

async function bootstrap(): Promise<void> {
    registerLifecycleDiagnostics();
    validateStartupEnv();

    await AppDataSource.initialize();
    console.log(`[${new Date().toISOString()}] Database connected`);

    const audioGrabberModule = createAudioGrabberModule(AppDataSource);

    const server = createServer();
    server.use("/api", createAuthMiddleware(AppDataSource));
    server.use("/api/library/thumbnail/:videoId", (req, res) => {
        const videoId = (req?.params?.videoId ?? "").toString().trim();
        if (!videoId) {
            res.status(400).json({ error: "Invalid video id" });
            return;
        }

        const mediaFile = findLibraryMediaByVideoId(videoId);
        if (mediaFile && path.extname(mediaFile).toLowerCase() === ".mp3") {
            try {
                const tags = nodeID3.read(mediaFile) as { image?: unknown };
                const image = tags?.image as { imageBuffer?: Buffer; mime?: string } | undefined;
                if (image?.imageBuffer instanceof Buffer && image.imageBuffer.length > 0) {
                    const mime = typeof image.mime === "string" && image.mime.length > 0 ? image.mime : "image/jpeg";
                    res.setHeader("Content-Type", mime);
                    res.send(image.imageBuffer);
                    return;
                }
            } catch {
                // fallback to sidecar file lookup below
            }
        }

        const sidecarThumbnail = findSidecarThumbnailByVideoId(videoId);
        if (sidecarThumbnail) {
            res.setHeader("Content-Type", toImageMimeFromExtension(sidecarThumbnail));
            res.sendFile(sidecarThumbnail);
            return;
        }

        res.status(404).json({ error: "Thumbnail not found" });
    });
    server.add<paths>("/api", apiSchema, audioGrabberModule, {
        validateRequests: true,
        validateResponses: false,
    });

    server.useErrorHandler((err, req, res) => {
        const status = typeof err?.status === "number" ? err.status : 500;
        const error = typeof err?.error === "string" ? err.error : "Internal Server Error";
        const details = typeof err?.details === "string"
            ? err.details
            : err instanceof Error
                ? err.message
                : "Unexpected error";

        console.error(`[${new Date().toISOString()}] ERROR ${status} ${req.method} ${req.url}`);
        console.error(`  Error: ${error}`);
        console.error(`  Details: ${details}`);
        res.status(status).json({ error, details });
    });

    await server.listen(port);
    console.info(`AudioGrabber API listening on http://localhost:${port}/api`);
}

await bootstrap().catch((error: unknown) => {
    console.error("AudioGrabber API bootstrap failed", error);
    process.exitCode = 1;
});
