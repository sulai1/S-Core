import { ConstructorOrCallable, RemoveNeverProps } from "../../generic";

export type FunctionsType = Record<string, readonly unknown[]>;

export type FunctionReturnType<T extends readonly unknown[]> =
    T extends readonly [...infer _Rest, infer Last]
    ? Last
    : undefined

export type FunctionParams<T extends readonly unknown[]> =
    T extends readonly [...infer First, infer _Rest]
    ? First
    : undefined

// Helper to get function names that return a specific type
export type FunctionsReturning<
    Defs extends Record<string, readonly unknown[]>,
    TargetType
> = RemoveNeverProps<{
    [K in keyof Defs]: Defs[K] extends readonly [...infer _Rest, infer Last]
    ? TargetType extends Last
    ? Defs[K]
    : never
    : never;
}>;

export type FunctionDefinitions = Record<string, readonly (readonly ConstructorOrCallable[])[]>;

export type InferFunctionTypes<F extends FunctionDefinitions> = {
    [K in keyof F]: UnionOfOverloads<F[K]>
};


type ConstructorToType<T> =
    T extends StringConstructor ? string :
    T extends NumberConstructor ? number :
    T extends BooleanConstructor ? boolean :
    T extends DateConstructor ? Date :
    T extends (new (...args: any[]) => infer R) ? R :
    unknown;

type OverloadToTuple<O extends readonly any[]> = readonly [
    ...{
        [K in keyof O]: ConstructorToType<O[K]>
    }
];

type UnionOfOverloads<Overloads extends readonly (readonly any[])[]> =
    Overloads extends readonly [infer First extends readonly any[], ...infer Rest extends readonly (readonly any[])[]]
    ? OverloadToTuple<First> | UnionOfOverloads<Rest>
    : never;
