import $RefParser from "@apidevtools/json-schema-ref-parser";
import type { Client, HttpRequest, HttpRequestOptions, OpenApiMethod, OpenApiModule } from "@s-core/core";
import axios from "axios";
import type { OpenAPIV3_1 } from "openapi-types";
import type { OperationObject, PathsObject } from "openapi-typescript";

/**
 * Creates an API module with the specified configuration. For each route in the configuration, 
 * a method is created on the module.
 *
 * @template T - The type of the API module, which is an object containing methods that are either `Get` or `Post`.
 * @template Name - The name of the API module, defaults to `string`.
 *
 * @param {URL | string} baseUrl - The base URL for the API.
 * @param {Constructor<T>} apiModule - The constructor for the API module.
 * @param {Api<Name, T>} api - The API configuration object containing the name and routes.
 * @param {any[]} [args] - Optional arguments to pass to the API module constructor.
 * @returns {T} - The instantiated API module with methods bound to the specified routes.
 */

export async function createOpenApiClient<
    Paths = OpenAPIV3_1.PathsObject | PathsObject,
    Options extends Omit<HttpRequest, "body" | "params" | "query" | "url" | "method"> = Omit<HttpRequest, "body" | "params" | "query" | "url" | "method">
>(
    pathOrSchema: string | OpenAPIV3_1.Document,
    schemaOrClient?: string | OpenAPIV3_1.Document | Client,
    options?: { client?: Client }
): Promise<OpenApiModule<Paths, Options>> {
    let baseURL = "";
    let schema: string | OpenAPIV3_1.Document;
    let client: Client | undefined;

    if (typeof schemaOrClient === "string" || (typeof schemaOrClient === "object" && schemaOrClient !== null && "openapi" in schemaOrClient)) {
        // New signature: createOpenApiClient(baseURL, schema, options?)
        baseURL = typeof pathOrSchema === "string" ? pathOrSchema : "";
        schema = schemaOrClient;
        client = options?.client;
    } else {
        // Backward-compatible signature: createOpenApiClient(schema, client?)
        schema = pathOrSchema;
        client = schemaOrClient as Client | undefined;
    }

    const resolvedClient = client || (axios.create({
        baseURL,
        headers: {
            'Content-Type': 'application/json',
        },
        withCredentials: true, // Enable sending cookies with cross-origin requests
    })) as Client;
    const bundledSchema = await $RefParser.bundle<OpenAPIV3_1.Document>(schema);
    const res = {} as OpenApiModule<Paths, Options>;
    for (const url in bundledSchema.paths) {
        const path = bundledSchema.paths[url];
        if (typeof path !== 'object' || path === null) {
            continue;
        }
        const ep = {} as Record<"get" | "post" | "put" | "delete" | "patch" | "head", OpenApiMethod<Paths>>;
        for (const methodKey in path) {
            const op = path[methodKey as keyof typeof path] as OperationObject;
            if (typeof op !== 'object' || op === null) {
                continue;
            }
            const method = methodKey.toLowerCase();
            switch (method) {
                case 'get':
                    ep[method] = (async (options?: object) => {
                        const res = await resolvedClient.get(url, options);
                        return res.data;
                    }) as OpenApiMethod<Paths>;
                    break;
                case 'post':
                    ep[method] = (async (req: unknown, options?: object) => {
                        const res = await resolvedClient.post(url, req, options);
                        return res.data;
                    }) as OpenApiMethod<Paths>;
                    break;
                case 'put':
                    ep[method] = (async (req: unknown, options?: object) => {
                        const res = await resolvedClient.put(url, req, options);
                        return res.data;
                    }) as OpenApiMethod<Paths>;
                    break;
                case 'delete':
                    ep[method] = (async (options?: HttpRequestOptions) => {
                        const res = await resolvedClient.delete(url, options);
                        return res.data;
                    }) as OpenApiMethod<Paths>;
                    break;
                case 'patch':
                    ep[method] = (async (body?: object, options?: HttpRequestOptions) => {
                        const res = await resolvedClient.patch(url, body, options);
                        return res.data;
                    }) as OpenApiMethod<Paths>;
                    break;
                case 'head':
                    ep[method] = (async (options?: HttpRequestOptions) => {
                        const res = await resolvedClient.head(url, options);
                        return res.data;
                    }) as OpenApiMethod<Paths>;
                    break;
                default:
                    console.warn(`Unsupported HTTP method in OpenAPI schema: ${method}`);
            }
        }
        res[url as keyof Paths] = ep as OpenApiModule<Paths, Options>[keyof Paths];
    }
    return res as OpenApiModule<Paths, Options>;
}
