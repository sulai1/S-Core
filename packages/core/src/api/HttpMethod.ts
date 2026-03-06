import { ContentType, Schema } from "..";

/**
 * Represents the allowed HTTP methods.
 */
export type HttpMethod = "get" | "post" | "put" | "delete" | "head" | "patch" | "options";

/**
 * Defines a route configuration.
 * @template Name - The name of the route.
 * @template Method - The type of request.
 * @template StatusOk - The status code for a successful request.
 * @template StatusError - The status code for an unsuccessful request.
 */

export type Method<
    Method extends HttpMethod = HttpMethod,
    Options = unknown,
    Res = unknown,
    Req = unknown,
    Params = unknown,
    Query = unknown
> = {
    /** defines the type of request */
    readonly method: Method;
    /** defines the route */

    readonly params?: Schema<Params>;
    readonly request?: Schema<Req>;
    readonly response: Schema<Res>;
    readonly query?: Schema<Query>;

    statusOk: number[];

    readonly timeout?: number;

    /** defines the status of the request upon success*/
    readonly contentType: ContentType;

    readonly options?: Options;
};