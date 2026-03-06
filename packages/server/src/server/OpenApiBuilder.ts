import path from 'path';
import { pathToFileURL } from 'url';
import { mkdirSync, writeFileSync } from 'fs';
import { writeFile } from 'fs/promises';
import { astToString, OpenAPI3 } from 'openapi-typescript';
import { OpenAPIV3_1 } from 'openapi-types';
import { ApiBuilder, BaseError } from '@s-core/core';
import RefParser from '@apidevtools/json-schema-ref-parser';

let openapiTS: typeof import('openapi-typescript').default;
async function loadOpenapiTS() {
    if (!openapiTS) {
        // @ts-ignore
        const mod = await import('openapi-typescript');
        openapiTS = mod.default;
    }
}
/**
 * creates an instance of an ApiBuilder
 * @param schemaUrl path or url to the OpenAPI schema
 * @param apiDir output directory
 * @returns a ApiBuilder instance
 */
export function createApiBuilder(): ApiBuilder {
    return new OpenApiBuilder();
}

class OpenApiBuilder implements ApiBuilder {

    async build(schemaUrl: string, apiDir: string): Promise<void> {
        await this.copyApi(schemaUrl, apiDir);
        const localSchemaFile = path.join(apiDir, path.basename(schemaUrl));
        await this.createTypesFromSchema(apiDir, localSchemaFile);
    }

    async createTypesFromSchema(apiDir: string, schema: string | OpenAPIV3_1.Document | OpenAPIV3_1.Document): Promise<void> {
        if (!openapiTS) {
            await loadOpenapiTS();
        }
        try {
            if (typeof schema === 'string') {
                const url = schema.startsWith('http') ? schema
                    : process.platform === 'win32'
                        ? pathToFileURL(schema).toString().replace('file:///', 'file://')
                        : pathToFileURL(schema).toString();
                const ast = await openapiTS(url);
                const contents = astToString(ast);
                await writeFile(path.join(apiDir, 'index.ts'), contents);
            } else {
                const ast = await openapiTS(schema as OpenAPI3);
                const contents = astToString(ast);
                await writeFile(path.join(apiDir, 'index.ts'), contents);
            }
        } catch (error) {
            throw new BaseError(
                'Error generating OpenAPI types: - check if the URL is correct and accessible.',
                {
                    cause: error instanceof Error ? error : undefined,
                    context: { apiDir },
                },
            );
        }
    }

    private async copyApi(
        schemaUrl: string,
        apiDir: string,
    ): Promise<void> {
        mkdirSync(apiDir, { recursive: true });
        const parser = new RefParser();
        const baseUrl = path.dirname(schemaUrl);
        const refs = await parser.resolve(schemaUrl);
        for (const url in refs._$refs) {
            const ref = refs._$refs[url];
            const relativePath = getRelativeRef(baseUrl, url);
            mkdirSync(path.join(apiDir, path.dirname(relativePath)), { recursive: true });
            writeFileSync(path.join(apiDir, relativePath), JSON.stringify(ref.value, null, 2));
        }
    }
}

function getRelativeRef(base: string, ref: string): string {
    if (/^https?:/.test(base)) {
        const baseUrl = new URL(base);
        const refUrl = new URL(ref, baseUrl);
        return path.relative(baseUrl.pathname, refUrl.pathname);
    } else {
        return path.relative(base, ref);
    }
}
