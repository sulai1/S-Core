import { FunctionsType } from "../../module/index.js";
import { DataSourceSchema } from "../schema/datasource/DatasourceSchema.js";
import { SerializedQuery } from "./SerializedQuery.js";
import { createExprFactory } from "./Expression.js";
import { FromMap, SelectBuilder, SerializedFromFor, WhereInput, ExprFactory, WhereBinds, SerializedExpression, Expr, ExprBase } from "./index.js";


export class SerializedSelectBuilder<
    Tables extends DataSourceSchema,
    Defs extends FunctionsType,
    Sources extends FromMap<Tables>,
    Ctx extends Record<string, unknown>,
    Row extends Record<string, unknown>,
    Binds extends readonly unknown[]
> implements SelectBuilder<Tables, Defs, Sources, Ctx, Row, Binds> {
    readonly expr = createExprFactory<Ctx, Defs>();

    constructor(private readonly query: SerializedQuery<SerializedFromFor<Tables, Sources>, Row, Binds>) { }

    where<C extends WhereInput<Ctx, Defs>>(
        condition: C | ((expr: ExprFactory<Ctx, Defs>) => C)
    ): SelectBuilder<Tables, Defs, Sources, Ctx, Row, [...Binds, ...WhereBinds<C>]> {
        const resolved = typeof condition === "function"
            ? condition(this.expr)
            : condition;
        const where = this.query.where ?? [];
        if (Array.isArray(resolved)) {
            where.push(...(resolved as unknown as SerializedExpression[]));
        } else {
            where.push(resolved as unknown as SerializedExpression);
        }
        this.query.where = where;
        return this as unknown as SelectBuilder<Tables, Defs, Sources, Ctx, Row, [...Binds, ...WhereBinds<C>]>;
    }

    orderBy<E extends Expr<Ctx, Defs, unknown> | (keyof Ctx & string)>(exp: E, desc?: boolean): SelectBuilder<Tables, Defs, Sources, Ctx, Row, E extends ExprBase<unknown, infer EB extends readonly unknown[]> ? [...Binds, ...EB] : Binds> {
        const orderBy = this.query.orderBy ?? [];
        orderBy.push({ exp: exp as unknown as SerializedExpression | string, desc });
        this.query.orderBy = orderBy;
        return this as unknown as SelectBuilder<Tables, Defs, Sources, Ctx, Row, E extends ExprBase<unknown, infer EB extends readonly unknown[]> ? [...Binds, ...EB] : Binds>;
    }

    groupBy<E extends Expr<Ctx, Defs, unknown> | (keyof Ctx & string)>(...exps: readonly E[]): SelectBuilder<Tables, Defs, Sources, Ctx, Row, Binds> {
        const groupBy = this.query.groupBy ?? [];
        groupBy.push(...(exps as unknown as (SerializedExpression | string)[]));
        this.query.groupBy = groupBy;
        return this;
    }

    build(): SerializedQuery<SerializedFromFor<Tables, Sources>, Row, Binds> {
        return this.query;
    }
}
