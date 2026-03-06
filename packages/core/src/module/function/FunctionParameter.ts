import { StringKeysOfType } from "../../generic";
import { FunctionDefinitionParams } from "./FunctionDefinition";

type Last<T> = T extends [...infer _, infer L] ? L : never;

type RemoveNeverProps<T extends object> = {
    [K in keyof T as T[K] extends never ? never : K]: T[K];
};

// Helper to get function names that return a specific type
export type FunctionsReturning<
    Defs extends Record<string, readonly (readonly unknown[])[]>,
    TargetType
> = RemoveNeverProps<{
    [K in keyof Defs]: Defs[K] extends readonly (infer Tuple)[]
    ? Last<Tuple> extends TargetType
    ? Defs[K]
    : never
    : never
}>;


type X = {
    "=": [[number, number, boolean]];
    "+": [[number, number, number]];
};

const f1: FunctionsReturning<X, boolean> = {
    "=": [[0, 0, true]],
};


export type FunctionParameter<
    ParamType,
    DataType extends object,
    Defs extends Record<string, any>
> =
    | StringKeysOfType<DataType, ParamType>  // Only property names that match the type
    | { value: ParamType }             // Direct value wrapper
    | {                                // Function call that returns the correct type - FIXED
        [K in keyof FunctionsReturning<Defs, ParamType>]: {
            function: K;
            params: K extends keyof Defs
            ? FunctionDefinitionParams<Defs[K]> extends readonly [...infer P]
            ? {
                [I in keyof P]: FunctionParameter<P[I], DataType, Defs>
            }
            : never
            : never;
        }
    }[keyof FunctionsReturning<Defs, ParamType>];