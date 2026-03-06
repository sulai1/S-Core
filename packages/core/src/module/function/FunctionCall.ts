import { Expression } from "./Expression";
import { FunctionParams, FunctionReturnType, FunctionsReturning, FunctionsType } from "./FunctionsType";

export type FunctionCall<
    ParamType = unknown,
    DataType extends Record<string, unknown> = Record<string, unknown>,
    Defs extends FunctionsType = FunctionsType
> = {
    [K in keyof Defs]: ParamType extends FunctionReturnType<Defs[K]> ? {
        function: K;
        params: K extends keyof Defs
        ? FunctionParams<Defs[K]> extends readonly [...infer P]
        ? {
            [I in keyof P]: Expression<P[I], DataType, Defs>;
        }
        : never
        : never;
    } : never
}[keyof FunctionsReturning<Defs, ParamType>]


export function isFunctionCall<T = any>(obj: unknown): obj is FunctionCall<T> {
    if (
        typeof obj === "object"
        && obj !== null
        && "function" in obj
        && typeof obj.function === "string"
        && "params" in obj
    ) {
        return true;
    }
    return false;
}
