import type { Readable } from "node:stream";
import { OpenApiBody } from "./OpenApiBody";
import { OpenApiPathParameter } from "./OpenApiPathParameter";
import { OpenApiQueryParameter } from "./OpenApiQueryParameter";
import { OpenApiResult } from "./OpenApiResult";

type OptionalResult<T> = T extends never
    ? Promise<void>
    : Promise<T | Readable>

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
        options?: Options & {
            query?: OpenApiQueryParameter<T, Path, Method>;
            params?: OpenApiPathParameter<T, Path, Method>;
        }
    ) => OptionalResult<OpenApiResult<T, Path, Method>>
    : (
        req: OpenApiBody<T, Path, Method>,
        options?: Options & {
            query?: OpenApiQueryParameter<T, Path, Method>;
            params?: OpenApiPathParameter<T, Path, Method>;
        }
    ) => OptionalResult<OpenApiResult<T, Path, Method>>

