import { OpenApiMethod } from "./OpenApiMethod.js";

/**
 * A OpenApiModule provides a implementation for every method of every path defined in a OpenAPI schema
 * @template Paths - The OpenAPI paths type.
 * @template Options - Additional options for the functions.
 */
export type OpenApiModule<Paths, Options extends object = object> = {
    [Path in keyof Paths]: {
        [Method in keyof Omit<Paths[Path], "parameters">]: Method extends "get" | "post" | "put" | "delete" | "patch" | "head"
        ? OpenApiMethod<Paths, Path, Method, Options>
        : never;
    };
};