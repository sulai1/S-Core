import "reflect-metadata";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "@s-core/server";
import { createAudioGrabberModule } from "./server/module.js";
import { AppDataSource } from "./data-source.js";
import { createAuthMiddleware } from "./server/auth.js";
import type { paths } from "./server/api/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiSchema = path.resolve(__dirname, "./server/api/schema.yaml");
const port = Number(process.env.PORT || 3800);

function validateStartupEnv(): void {
    const workerMode = (process.env.AUDIOGRABBER_WORKER_MODE ?? "stub").toLowerCase();
    if (workerMode !== "python") {
        return;
    }

    const apiKey = (process.env.AUDIOGRABBER_YT_API_KEY ?? "").trim();
    if (!apiKey) {
        throw new Error("Missing required AUDIOGRABBER_YT_API_KEY for python worker mode.");
    }
}

async function bootstrap(): Promise<void> {
    validateStartupEnv();

    await AppDataSource.initialize();
    console.log(`[${new Date().toISOString()}] Database connected`);

    const audioGrabberModule = createAudioGrabberModule(AppDataSource);

    const server = createServer();
    server.use("/api", createAuthMiddleware(AppDataSource));
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

bootstrap().catch((error: unknown) => {
    console.error("AudioGrabber API bootstrap failed", error);
    process.exitCode = 1;
});
