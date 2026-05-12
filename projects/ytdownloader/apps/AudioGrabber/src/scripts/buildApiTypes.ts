import path from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
import openapiTS, { astToString } from "openapi-typescript";
import { writeFile } from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.resolve(__dirname, "../server/api/schema.yaml");
const outputPath = path.resolve(__dirname, "../server/api/index.ts");

async function buildTypes(): Promise<void> {
    const schemaUrl = process.platform === "win32"
        ? pathToFileURL(schemaPath).toString().replace("file:///", "file://")
        : pathToFileURL(schemaPath).toString();
    const ast = await openapiTS(schemaUrl);
    const generated = astToString(ast);
    await writeFile(outputPath, generated, "utf8");
}

buildTypes().catch((error: unknown) => {
    console.error("Failed to build OpenAPI types", error);
    process.exitCode = 1;
});
