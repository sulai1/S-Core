import { SerializedFrom, SerializedExpression } from "./index.js";


export type SerializedQuery<
    From extends SerializedFrom = SerializedFrom,
    Row extends Record<string, unknown> = Record<string, unknown>,
    Binds extends readonly unknown[] = readonly unknown[]
> = {
    from: From;
    select?: Record<string, SerializedExpression | string>;
    where?: SerializedExpression[];
    orderBy?: { exp: SerializedExpression | string; desc?: boolean; }[];
    groupBy?: (SerializedExpression | string)[];
    readonly __row?: Row;
    readonly __binds?: Binds;
};
