import { FunctionReturnType, FunctionsType } from "../../module/index.js";
import { DataSourceSchema, TableInstanceTypes } from "../schema/datasource/DatasourceSchema.js";
import { SerializedQuery } from "./SerializedQuery.js";


export * from "./Column.js";
export * from "./Value.js";
export * from "./Function.js";
export * from "./Expression.js";
export * from "./QuerySerializer.js";
export * from "./SerializedQuery.js";
export * from "./Value.js"

type Merge<U> = (
    U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
    ? { [K in keyof I]: I[K] }
    : never;

export type ExprBase<Out, Binds extends readonly unknown[]> = {
    readonly __out?: Out;
    readonly __binds?: Binds;
};

type BindsOf<T> =
    T extends ExprBase<unknown, infer B extends readonly unknown[]>
    ? B
    : readonly [];

export type Depth = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type PrevDepth<D extends Depth> =
    D extends 6 ? 5 :
    D extends 5 ? 4 :
    D extends 4 ? 3 :
    D extends 3 ? 2 :
    D extends 2 ? 1 :
    D extends 1 ? 0 :
    0;

type ParamTuple<F extends readonly unknown[]> =
    F extends readonly [...infer P, unknown]
    ? readonly [...P]
    : readonly [];

type ParamOutTuple<
    P extends readonly unknown[]
> = {
        [I in keyof P]: P[I] extends ExprBase<infer O, readonly unknown[]> ? O : never;
    };

type OverloadsForName<
    Defs extends FunctionsType,
    Name extends keyof Defs & string
> = Defs[Name] extends readonly unknown[]
    ? Defs[Name]
    : never;

type OverloadParamTuple<
    Defs extends FunctionsType,
    Name extends keyof Defs & string
> = ParamTuple<OverloadsForName<Defs, Name>>;

type MatchingOverloads<
    Overloads extends readonly unknown[],
    POut extends readonly unknown[]
> = Overloads extends readonly [...infer P, unknown]
    ? POut extends P
    ? Overloads
    : never
    : never;

export type ReturnForArgs<
    Defs extends FunctionsType,
    Name extends keyof Defs & string,
    P extends readonly unknown[]
> = FunctionReturnType<MatchingOverloads<OverloadsForName<Defs, Name>, ParamOutTuple<P>>>;

type FunctionNamesReturning<
    Defs extends FunctionsType,
    Out
> = {
    [K in keyof Defs & string]: FunctionReturnType<Defs[K]> extends Out ? K : never;
}[keyof Defs & string];

export type ParamsExprTuple<
    Ctx extends Record<string, unknown>,
    Defs extends FunctionsType,
    Name extends keyof Defs & string,
    D extends Depth
> = OverloadParamTuple<Defs, Name> extends readonly [...infer P]
    ? {
        [I in keyof P]: Expr<Ctx, Defs, P[I], D>
    }
    : readonly [];

type BindsFromTuple<
    T extends readonly unknown[],
    Acc extends readonly unknown[] = readonly []
> = T extends readonly [infer H, ...infer R]
    ? BindsFromTuple<R, [...Acc, ...BindsOf<H>]>
    : Acc;

type WhereExpr<
    Ctx extends Record<string, unknown>,
    Defs extends FunctionsType,
> = Expr<Ctx, Defs, boolean>;

export type WhereInput<
    Ctx extends Record<string, unknown>,
    Defs extends FunctionsType,
> = WhereExpr<Ctx, Defs> | readonly WhereExpr<Ctx, Defs>[];

export type WhereBinds<C> = C extends readonly unknown[]
    ? BindsFromTuple<C>
    : BindsOf<C>;

export type ColumnExpr<
    Ctx extends Record<string, unknown>,
    Out = unknown
> = {
    [K in keyof Ctx & string]: Ctx[K] extends Out
    ? ({
        kind: "column";
        name: K;
    } & ExprBase<Ctx[K], readonly []>)
    : never;
}[keyof Ctx & string];

export type ValueExpr<V> = {
    kind: "value";
    value: V;
} & ExprBase<V, readonly [V]>;

export type FunctionExpr<
    Ctx extends Record<string, unknown>,
    Defs extends FunctionsType,
    Name extends keyof Defs & string,
    D extends Depth = 5,
    P extends readonly unknown[] = ParamsExprTuple<Ctx, Defs, Name, D>
> = {
    kind: "call";
    function: Name;
    params: P;
} & ExprBase<
    ReturnForArgs<Defs, Name, P>,
    BindsFromTuple<P>
>;

type FunctionExprReturning<
    Ctx extends Record<string, unknown>,
    Defs extends FunctionsType,
    Out,
    D extends Depth
> = {
    [N in FunctionNamesReturning<Defs, Out> & string]: FunctionExpr<Ctx, Defs, N, PrevDepth<D>>;
}[FunctionNamesReturning<Defs, Out> & string];

export type Expr<
    Ctx extends Record<string, unknown>,
    Defs extends FunctionsType,
    Out = unknown,
    D extends Depth = 5
> =
    | ColumnExpr<Ctx, Out>
    | ValueExpr<Out>
    | (D extends 0 ? never : FunctionExprReturning<Ctx, Defs, Out, D>);

export type NestedSource<
    Row extends Record<string, unknown> = Record<string, unknown>,
    Binds extends readonly unknown[] = readonly unknown[]
> = {
    query: SerializedQuery<SerializedFrom, Row, Binds>;
    lateral?: boolean;
};

export type FromSource<Tables extends DataSourceSchema> =
    | (keyof Tables & string)
    | NestedSource<Record<string, unknown>, readonly unknown[]>;

export type FromMap<Tables extends DataSourceSchema> = Record<string, FromSource<Tables>>;

type ResolveSourceRow<
    Tables extends DataSourceSchema,
    Source
> = Source extends keyof Tables & string
    ? TableInstanceTypes<Tables>[Source]
    : Source extends NestedSource<infer Row extends Record<string, unknown>, readonly unknown[]>
    ? Row
    : never;

type Prefix<
    Alias extends string,
    Shape extends Record<string, unknown>
> = {
        [K in keyof Shape & string as `${Alias}.${K}`]: Shape[K];
    };

export type ContextFrom<
    Tables extends DataSourceSchema,
    Sources extends FromMap<Tables>
> = Merge<{
    [A in keyof Sources & string]: Prefix<A, ResolveSourceRow<Tables, Sources[A]>>;
}[keyof Sources & string]>;

export type SelectShape<
    Ctx extends Record<string, unknown>,
    Defs extends FunctionsType
> = Record<string, Expr<Ctx, Defs, unknown, 1> | (keyof Ctx & string)>;

export type ExprFactory<
    Ctx extends Record<string, unknown>,
    Defs extends FunctionsType,
    D extends Depth = 5,
> = {
    col<K extends keyof Ctx & string>(name: K): ColumnExpr<Ctx, Ctx[K]>;
    val<V>(value: V): ValueExpr<V>;
    fn<Name extends keyof Defs & string>(
        name: Name,
        ...params: ParamsExprTuple<Ctx, Defs, Name, D>
    ): Expr<Ctx, Defs, ReturnForArgs<Defs, Name, ParamsExprTuple<Ctx, Defs, Name, D>>, D>;
};

type SelectOut<
    Ctx extends Record<string, unknown>,
    V
> = V extends keyof Ctx & string
    ? Ctx[V]
    : V extends ExprBase<infer O, readonly unknown[]>
    ? O
    : never;

export type RowFromSelect<
    Ctx extends Record<string, unknown>,
    Defs extends FunctionsType,
    S extends SelectShape<Ctx, Defs>
> = {
        [K in keyof S & string]: SelectOut<Ctx, S[K]>;
    };

export type SerializedExpression =
    | { kind: "column"; name: string }
    | { kind: "value"; value: unknown }
    | { kind: "call"; function: string; params: readonly SerializedExpression[] };

export type SerializedFrom = Record<
    string,
    string | { query: SerializedQuery<SerializedFrom, Record<string, unknown>, readonly unknown[]>; lateral?: boolean }
>;

export type SerializedFromFor<
    Tables extends DataSourceSchema,
    Sources extends FromMap<Tables>
> = {
        [A in keyof Sources & string]: Sources[A] extends keyof Tables & string
        ? Sources[A]
        : Sources[A] extends NestedSource<Record<string, unknown>, readonly unknown[]>
        ? { query: Sources[A]["query"]; lateral?: Sources[A]["lateral"] }
        : never;
    };

export type FromBuilder<
    Tables extends DataSourceSchema,
    Defs extends FunctionsType,
    Sources extends FromMap<Tables>,
    Ctx extends Record<string, unknown>
> = {
    expr: ExprFactory<Ctx, Defs>;
    lateralFrom<
        Alias extends string,
        NestedSources extends FromMap<Tables>,
        Row extends Record<string, unknown>,
        Binds extends readonly unknown[]
    >(
        alias: Alias,
        sources: NestedSources,
        build: (from: FromBuilder<Tables, Defs, NestedSources, Ctx & ContextFrom<Tables, NestedSources>>) => SelectBuilder<Tables, Defs, NestedSources, Ctx & ContextFrom<Tables, NestedSources>, Row, Binds>,
    ): FromBuilder<Tables, Defs, Sources & Record<Alias, NestedSource<Row, Binds>>, ContextFrom<Tables, Sources & Record<Alias, NestedSource<Row, Binds>>>>;
    select<S extends SelectShape<Ctx, Defs>>(shape: S): SelectBuilder<Tables, Defs, Sources, Ctx, RowFromSelect<Ctx, Defs, S>, readonly []>;
};

export type SelectBuilder<
    Tables extends DataSourceSchema,
    Defs extends FunctionsType,
    Sources extends FromMap<Tables>,
    Ctx extends Record<string, unknown>,
    Row extends Record<string, unknown>,
    Binds extends readonly unknown[]
> = {
    expr: ExprFactory<Ctx, Defs>;
    where<C extends WhereInput<Ctx, Defs>>(
        condition: C | ((expr: ExprFactory<Ctx, Defs>) => C)
    ): SelectBuilder<Tables, Defs, Sources, Ctx, Row, [...Binds, ...WhereBinds<C>]>;
    orderBy<E extends Expr<Ctx, Defs, unknown> | (keyof Ctx & string)>(exp: E, desc?: boolean): SelectBuilder<Tables, Defs, Sources, Ctx, Row, E extends ExprBase<unknown, infer EB extends readonly unknown[]> ? [...Binds, ...EB] : Binds>;
    groupBy<E extends Expr<Ctx, Defs, unknown> | (keyof Ctx & string)>(...exps: readonly E[]): SelectBuilder<Tables, Defs, Sources, Ctx, Row, Binds>;
    limit(limit: number): SelectBuilder<Tables, Defs, Sources, Ctx, Row, Binds>;
    offset(offset: number): SelectBuilder<Tables, Defs, Sources, Ctx, Row, Binds>;
    build(): SerializedQuery<SerializedFromFor<Tables, Sources>, Row, Binds>;
};


