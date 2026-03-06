import RefParser from '@apidevtools/json-schema-ref-parser';
import { mkdirSync, writeFileSync } from 'fs';
import { writeFile } from 'fs/promises';
import { OpenAPIV3_1 } from 'openapi-types';
import openapiTS, { astToString, OpenAPI3 } from 'openapi-typescript';
import path from 'path';
import { argv } from 'process';
import { fileURLToPath, pathToFileURL } from 'url';
import { BaseError } from '../src/BaseError.js';
import { OpenAPIV3 } from '../src/api/schema/index.js';
import { ApiBuilder } from '../src/index.js';


export class OpenApiBuilder implements ApiBuilder {

    async build(schemaUrl: string, apiDir: string): Promise<void> {
        await this.copyApi(schemaUrl, apiDir);
        const localSchemaFile = path.join(apiDir, path.basename(schemaUrl));
        await this.createTypesFromSchema(localSchemaFile, apiDir);
    }

    async createTypesFromSchema(schema: string | OpenAPIV3.Document| OpenAPIV3_1.Document,apiDir: string): Promise<void> {
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


export function buildApiType(schemaUrl: string = './src/server/api/schema.yaml', apiDir: string = './src/server/api'): Promise<void> {
    const apiBuilder =  new OpenApiBuilder();
    return apiBuilder.build(schemaUrl, apiDir);
};

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
    const apiSchema = argv[2] || './src/server/api/schema.yaml';
    const apiDir = argv[3] || './src/server/api';

    buildApiType(apiSchema, apiDir).catch((error) => {
        process.exitCode = 1;
        throw error;
    });
}