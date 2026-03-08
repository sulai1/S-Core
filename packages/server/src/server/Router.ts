import { HttpRequest, HttpResponseBuilder, OpenApiModule } from '@s-core/core';
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { RequestHandler } from 'express';
import { Handler } from './index.js';

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options';

export type OpenapiPaths<Paths> = {
    [P in keyof Paths]: {
        [M in HttpMethod]?: unknown;
    };
};


export interface Router<
    Req extends HttpRequest = HttpRequest,
    Res extends HttpResponseBuilder = HttpResponseBuilder
> {
    /**
     * Uses a handler for all requests .
     * @param handler a middleware handler function
     */
    use(handler: RequestHandler): this;
    /**
     * 
     * Uses a handler for requests to a specific path.
     * @param path a path string
     * @param handler a middleware handler function
     */
    use<
        TReq extends Req = Req,
        TRes extends Res = Res
    >(path: string, handler: RequestHandler): this;
    useErrorHandler<TReq extends Req = Req, TRes extends Res = Res>(
        handler: (err: any, req: TReq, res: TRes, next: () => void) => void
    ): this;
    /**
     * add a module to a specific path, and validate requests and responses from a json schema.
     * @param path the path to add the module to
     * @param schema the path to the schema file
     * @param module the implementation to add
     * @param options options for request and response validation
     * @returns the router instance
     */
    add<
        M extends OpenapiPaths<M>,
    >(
        path: string,
        schema: string | OpenAPIV3.Document | OpenAPIV3_1.Document,
        module: OpenApiModule<M, Req>,
        options?: {
            validateRequests?: boolean;
            validateResponses?: boolean;
        }
    ): this;
    /**
     * Extends the request types with additional properties for a specific path.
     * @param path the path to extend
     * @param api a function that returns additional properties to add to the request
     * @returns a new Router with the extended request type, allowing handlers to access the new properties
     */
    extend<Extension extends object>(
        path: string,
        api: RequestHandler,
        get: (req: Req) => Extension
    ): Router<Req & Extension, Res>;
}
