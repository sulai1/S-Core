import "reflect-metadata";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "@s-core/server";
import { audioGrabberModule } from "./server/module.js";
import type { paths } from "./server/api/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiSchema = path.resolve(__dirname, "./server/api/schema.yaml");
const port = Number(process.env.PORT || 3800);

async function bootstrap(): Promise<void> {
    const server = createServer();
    server.add<paths>("/api", apiSchema, audioGrabberModule, {
        validateRequests: true,
        validateResponses: false,
    });

    await server.listen(port);
    console.info(`AudioGrabber API listening on http://localhost:${port}/api`);
}

bootstrap().catch((error: unknown) => {
    console.error("AudioGrabber API bootstrap failed", error);
    process.exitCode = 1;
});
