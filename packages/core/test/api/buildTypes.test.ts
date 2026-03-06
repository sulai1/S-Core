import fs, { existsSync, mkdirSync } from "fs";
import * as path from "path";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { OpenApiBuilder } from "../../scripts";

const openApiUrl = "https://raw.githubusercontent.com/NginxProxyManager/nginx-proxy-manager/develop/backend/schema/swagger.json";
const testDir = path.resolve(__dirname, "test-api");
const apiFile = path.resolve(__dirname, "schema.yaml");
const testDirPermanent = path.resolve(__dirname, "test-api-permanent");

const apiBuilder = new OpenApiBuilder();
beforeAll(() => {

    if (existsSync(testDirPermanent)) {
        fs.rmSync(testDirPermanent, { recursive: true, force: true });
    }
});


beforeEach(() => {
    if (existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });
    mkdirSync(testDirPermanent, { recursive: true });
});
afterEach(() => {
    if (existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
    }
});

describe("OpenAPI Type Builder", () => {
    test("should download referenced files", async () => {
        await apiBuilder.build(openApiUrl, testDir);
        expect(existsSync(testDir + "/index.ts")).toBeTruthy();
        expect(existsSync(testDir + "/common.json")).toBeTruthy();
        expect(existsSync(testDir + "/paths")).toBeTruthy();
        expect(existsSync(testDir + "/components")).toBeTruthy();
    }, 50000);
    test("should copy local schema file", async () => {
        await apiBuilder.build(apiFile, testDirPermanent);
        expect(existsSync(testDirPermanent + "/index.ts")).toBeTruthy();
    });
    test("should validate a response", async () => {
        await apiBuilder.build(apiFile, testDirPermanent);
        expect(existsSync(testDirPermanent + "/index.ts")).toBeTruthy();
    }, 10000);
    test("should build types from OpenAPIV3 schema object", async () => {
        await apiBuilder.createTypesFromSchema({
            openapi: "3.1.0",
            info: {
                title: "Test API",
                version: "1.0.0",
                summary: "A test API schema",
            },
            paths: {
                test: {
                    get: {
                        responses: {
                            "200": {
                                description: "Successful response",
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object",
                                            properties: {
                                                message: {
                                                    type: "string",
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        }
                    }
                }
            },
            components: {
            },
            webhooks: {
            }
        },testDir);
        expect(existsSync(testDir + "/index.ts")).toBeTruthy();
    }, 10000);
});