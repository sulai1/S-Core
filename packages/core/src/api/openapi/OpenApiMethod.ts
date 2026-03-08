import { OpenApiBody } from "./OpenApiBody.js";
import { OpenApiPathParameter } from "./OpenApiPathParameter.js";
import { OpenApiQueryParameter } from "./OpenApiQueryParameter.js";
import { OpenApiResult } from "./OpenApiResult.js";

type OptionalResult<T> = T extends never
    ? Promise<void>
    : Promise<T>

type MethodOptions<
    T,
    Path extends keyof T,
    Method extends keyof T[Path],
    Options extends object,
> = Omit<Options, 'query' | 'params'> & {
    query?: OpenApiQueryParameter<T, Path, Method>;
    params?: OpenApiPathParameter<T, Path, Method>;
}

/**
 * an implementation of a function corresponding to an OpenAPI path and method
 * @template T - The OpenAPI schema type.
 * @template Path - The path in the OpenAPI schema.
 * @template Method - The HTTP method for the path.
 * @template Options - Additional options for the function.
 */
export type OpenApiMethod<
    T,
    Path extends keyof T = keyof T,
    Method extends keyof T[Path] = keyof T[Path],
    Options extends object = object,
> =
    Method extends "get" | "head" | "delete" ? (
        options?: MethodOptions<T, Path, Method, Options>
    ) => OptionalResult<OpenApiResult<T, Path, Method>>
    : (
        req: OpenApiBody<T, Path, Method>,
        options?: MethodOptions<T, Path, Method, Options>
    ) => OptionalResult<OpenApiResult<T, Path, Method>>

