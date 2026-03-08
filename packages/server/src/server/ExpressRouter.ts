import { existsSync } from 'fs';
import { Readable } from 'stream';
import $RefParser from '@apidevtools/json-schema-ref-parser';
import { ApiError, OpenApiModule } from '@s-core/core';
import { Ajv } from 'ajv';
import express, { RequestHandler } from 'express';
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import multer from 'multer';
import { OpenapiPaths, Router } from './Router.js';
import { Handler } from './index.js';

// Type guard for Node.js Readable stream
function isReadableStream(val: unknown): val is Readable {
    if (val === null || val === undefined) {
        return false;
    }
    return typeof val === 'object' &&
        "pipe" in val &&
        "read" in val &&
        "readable" in val &&
        (val as { readable: unknown }).readable === true;
}

// Helper: dynamic body parser middleware
function dynamicBodyParser(contentTypes: string[]): express.RequestHandler {
    const parsers: { [key: string]: express.RequestHandler } = {};
    if (contentTypes.includes('application/json')) {
        parsers['application/json'] = express.json();
    }
    if (contentTypes.includes('application/x-www-form-urlencoded')) {
        parsers['application/x-www-form-urlencoded'] = express.urlencoded({ extended: true });
    }
    if (contentTypes.includes('text/plain')) {
        parsers['text/plain'] = express.text();
    }
    if (contentTypes.includes('application/octet-stream')) {
        parsers['application/octet-stream'] = express.raw();
    }
    if (contentTypes.includes('application/pdf')) {
        parsers['application/pdf'] = express.raw({ type: 'application/pdf' });
    }
    if (contentTypes.includes('multipart/form-data')) {
        // Use multer with memory storage for file uploads
        const upload = multer({ storage: multer.memoryStorage() });
        parsers['multipart/form-data'] = upload.any();
    }
    return (req, res, next) => {
        const type = (req.headers['content-type'] || '').split(';')[0].trim();
        const parser = parsers[type];
        if (parser) {
            return parser(req, res, next);
        } else {
            // No parser for this content-type, skip
            return next();
        }
    };
}

type ExpressRouterOptions = {
    logger: {
        warn: (...optionalParams: unknown[]) => void
        info: (...optionalParams: unknown[]) => void
    }
};

/**
 * ExpressRouter is an implementation of the Router interface using Express.js.
 * @param Req - The type of the request object.
 * @param Res - The type of the response object.
 * @implements Router<Req, Res>
 * @returns An instance of ExpressRouter that can register routes and extend functionality.
 */
export class ExpressRouter<
    Req extends express.Request = express.Request,
    Res extends express.Response = express.Response
> implements Router<Req, Res> {
    readonly router: express.Router;
    readonly options: ExpressRouterOptions;
    private readonly pendingRouteRegistrations = new Set<Promise<void>>();

    constructor(router: express.Router, options?: Partial<ExpressRouterOptions>) {
        this.router = router;
        this.options = { logger: console, ...options };
    }

    protected async waitForPendingRouteRegistrations(): Promise<void> {
        if (this.pendingRouteRegistrations.size === 0) {
            return;
        }
        await Promise.all(Array.from(this.pendingRouteRegistrations));
    }

    /**
     * Uses a middleware handler. If a path is provided, the handler is mounted at that path. 
     * If no path is provided, the handler is used for all requests.
     * @param path a path string or a middleware handler function
     * @param handler a middleware handler function
     * @returns the router instance
     */
    use<TReq extends Req = Req, TRes extends Res = Res>(
        path: string | RequestHandler,
        handler?: RequestHandler
    ): this {
        if (typeof path === 'string') {
            if (!handler) {
                throw new Error("Handler must be provided when path is a string");
            }
            // mount delegator so Express calls the current handler stored in ref
            this.router.use(path, handler);
        } else {
            this.router.use(path);
        }
        return this;
    };

    /**
     * Registers an error handling middleware. Error handlers in Express require 
     * 4 parameters (err, req, res, next) to be recognized as error middleware.
     * @param handler an error handling function with signature (err, req, res, next)
     * @returns the router instance
     */
    useErrorHandler<TReq extends Req = Req, TRes extends Res = Res>(
        handler: (err: any, req: TReq, res: TRes, next: () => void) => void
    ): this {
        const ref = { handler };
        // Express recognizes error handlers by the 4-parameter signature
        this.router.use((err: any, req: express.Request, res: express.Response, next: () => void) => {
            return ref.handler(err, req as TReq, res as TRes, next);
        });
        return this;
    };

    private createMiddlewares(path: string, method: string, op: OpenAPIV3.OperationObject, ajv: Ajv, options: { validateRequests?: boolean; validateResponses?: boolean }): Array<express.RequestHandler> {
        const middlewares: Array<express.RequestHandler> = [];

        const body = op.requestBody;
        if (!body || typeof body !== 'object' || !('content' in body)) {
            return middlewares;
        }
        const contentTypes = Object.keys(body.content);
        if (contentTypes.length > 0) {
            middlewares.push(dynamicBodyParser(contentTypes));
        }

        if (options?.validateRequests) {
            const content = body.content["application/json"];
            if (!content) {
                return middlewares;
            }
            if ("schema" in content) {
                const pointer = `root#/paths/${path.replace(/\//g, '~1')}/${method.toLowerCase()}/requestBody/content/application~1json/schema`;
                let validate;
                try {
                    validate = ajv.compile({ $ref: pointer });
                } catch (e) {
                    throw new Error(`Failed to compile schema validator for ${method.toUpperCase()} ${path}: ${(e as Error).message}`);
                }
                middlewares.push((req, res, next) => {

                    const validReq = validate(req.body);
                    if (!validReq) {
                        res.status(400).json({ message: `Request validation failed`, errors: validate.errors });
                    } else {
                        next();
                    }
                });
            }
        }
        return middlewares;
    }

    private registerApiRoutes<M extends OpenapiPaths<M>>(
        router: express.Router,
        basePath: string,
        api: OpenAPIV3_1.Document | OpenAPIV3.Document,
        module: OpenApiModule<M, Req>,
        ajv: Ajv,
        options?: {
            validateRequests?: boolean;
            validateResponses?: boolean;
        }
    ): void {
        this.options.logger.info(`Registering router ${basePath} ${api.info.title}`);

        for (const url in api.paths) {
            const pathItem = api.paths[url];
            if (typeof pathItem !== 'object' || pathItem === null) {
                continue;
            }

            const expressUrl = url.replace(/\{([^}]+)\}/g, ':$1');
            for (const methodName of Object.keys(pathItem) as (keyof typeof pathItem)[]) {
                const impl = module[url as keyof typeof module]?.[methodName as keyof typeof module[keyof typeof module]];
                const op = pathItem[methodName] as OpenAPIV3.OperationObject;

                if (!impl) {
                    this.options.logger.warn(`No implementation found for ${methodName.toUpperCase()} ${url}`);
                    continue;
                }

                const middlewares = this.createMiddlewares(url, methodName, op, ajv, options || {});
                this.options.logger.info(`Registering route ${methodName.toUpperCase()} ${expressUrl} for OpenAPI module ${api.info.title}`);

                const method = methodName as 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options';
                router[method](expressUrl, ...middlewares, async (req, res, next) => {
                    try {
                        const value = ["post", "put", "patch"].includes(methodName)
                            ? await impl(req.body, {
                                ...req,
                                ...req.body,
                                ...req.params,
                                ...req.query
                            }) : await impl({
                                ...req,
                                ...req.body,
                                ...req.params,
                                ...req.query
                            });
                        await handleContentType(op.responses, value, req, res);
                    } catch (error) {
                        next(error);
                    }
                });
            }
        }

        router.get('/', async (req, res) => {
            const result = Object.keys(module);
            res.status(200).json(result);
        });
    }

    /**
     * Add a module to a specific path, and validate requests and responses from a json schema. 
     * It registers routes on the Express router based on the OpenAPI schema and the provided module implementation.
     * The appropriate body parsers and validation middlewares are added based on the schema and supported content types. 
     * @param path the path to add the module to
     * @param schema the path to the schema file
     * @param module the implementation to add
     * @param options options for request and response validation
     * @returns the router instance
     * 
     * @template M - The type of the OpenAPI paths is used to infere the module type.
     */
    add<M extends OpenapiPaths<M>>(
        path: string,
        schema: string | OpenAPIV3.Document | OpenAPIV3_1.Document,
        module: OpenApiModule<M, Req>,
        options?: {
            validateRequests?: boolean;
            validateResponses?: boolean;
        }
    ): this {
        const router = express.Router();
        // Mount the router immediately so it's available when requests come in
        this.router.use(path, router);

        const ajv = new Ajv({ allErrors: true, strict: false, coerceTypes: true });
        if (typeof schema !== "string") {
            ajv.addSchema(schema, "root");
            this.registerApiRoutes(router, path, schema, module, ajv, options);
            return this;
        }

        if (!existsSync(schema)) {
            throw new Error(`Schema file not found: ${schema}`);
        }

        const registrationPromise = $RefParser.bundle<OpenAPIV3_1.Document | OpenAPIV3.Document>(schema)
            .then((bundled) => {
                ajv.addSchema(bundled, "root");
                this.registerApiRoutes(router, path, bundled, module, ajv, options);
            })
            .catch((err) => {
                throw new Error(`Failed to bundle schema: ${(err as Error).message}`);
            });

        this.pendingRouteRegistrations.add(registrationPromise);
        void registrationPromise.finally(() => {
            this.pendingRouteRegistrations.delete(registrationPromise);
        });

        return this;
    }

    /**
     * extends the request types with additional properties for a specific path.
     * @param path the path to extend
     * @param middleware a function that returns additional properties to add to the request and allways calls next
     * @returns a new Router with the extended request type, allowing handlers to access the new properties
     */
    extend<Extension extends object = {}>(
        path: string,
        middleware: RequestHandler,
    ): Router<Req & Extension, Res> {
        const router = express.Router();
        router.use(middleware);
        this.router.use(path, router);
        return new ExpressRouter(router);
    }
}
async function dereference<T>(obj: T | OpenAPIV3.ReferenceObject): Promise<T> {
    if (typeof obj === "object" && obj !== null && "$ref" in obj) {
        return await $RefParser.dereference(obj) as T;
    }
    return obj as T;
}

async function handleContentType(responses: OpenAPIV3.ResponsesObject | undefined, value: unknown, req: express.Request, res: express.Response): Promise<void> {
    if (!responses) {
        return;
    }
    // get first content type
    const ok = Object.keys(responses)[0]
    const response = await dereference(responses[ok]);
    const contentTypes = Object.keys(response.content || {});

    for (const type of contentTypes) {
        switch (type) {
            case 'text/plain':
                if (typeof value === "string") {
                    res.status(Number(ok)).type(type).send(value);
                    return;
                } else if (isReadableStream(value)) {
                    res.status(Number(ok));
                    value.pipe(res);
                    return;
                } else if (Buffer.isBuffer(value)) {
                    res.status(Number(ok)).type(type).send(value);
                    return;
                }
                break;
            case 'application/octet-stream':
            case 'application/pdf':
            case "image/png":
            case "image/jpeg":
            case "image/gif":
                if (typeof value === "string") {
                    res.status(Number(ok)).sendFile(value);
                    return;
                } else if (isReadableStream(value)) {
                    res.status(Number(ok));
                    value.pipe(res);
                    return;
                } else if (Buffer.isBuffer(value)) {
                    res.status(Number(ok)).type(type).send(value);
                    return;
                }
        }
    }
    if (value)
        res.status(Number(ok)).json(value);
    res.status(Number(ok)).end();
}
