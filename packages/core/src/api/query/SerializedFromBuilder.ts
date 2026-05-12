import { FunctionsType } from "../../module/index.js";
import { DataSourceSchema } from "../schema/datasource/DatasourceSchema.js";
import { SerializedSelectBuilder } from "./SerializedSelectBuilder.js";
import { createExprFactory } from "./Expression.js";
import { ContextFrom, FromMap, FromBuilder, NestedSource, SelectShape, SelectBuilder, RowFromSelect, SerializedFrom, SerializedFromFor, SerializedQuery } from "./index.js";

export class SerializedFromBuilder<
    Tables extends DataSourceSchema,
    Defs extends FunctionsType,
    Sources extends FromMap<Tables>,
    Ctx extends Record<string, unknown>> implements FromBuilder<Tables, Defs, Sources, Ctx> {
    readonly expr = createExprFactory<Ctx, Defs>();

    constructor(private readonly sources: Sources) { }

    lateralFrom<
        Alias extends string,
        NestedSources extends FromMap<Tables>,
        Row extends Record<string, unknown>,
        Binds extends readonly unknown[]
    >(
        alias: Alias,
        nestedSources: NestedSources,
        build: (from: FromBuilder<Tables, Defs, NestedSources, Ctx & ContextFrom<Tables, NestedSources>>) => SelectBuilder<Tables, Defs, NestedSources, Ctx & ContextFrom<Tables, NestedSources>, Row, Binds>,
    ): FromBuilder<Tables, Defs, Sources & Record<Alias, NestedSource<Row, Binds>>, ContextFrom<Tables, Sources & Record<Alias, NestedSource<Row, Binds>>>> {
        const nestedFrom = new SerializedFromBuilder<Tables, Defs, NestedSources, Ctx & ContextFrom<Tables, NestedSources>>(nestedSources);
        const query = build(nestedFrom).build();
        const nextSources = {
            ...this.sources,
            [alias]: {
                query: query as unknown as SerializedQuery<SerializedFrom, Row, Binds>,
                lateral: true,
            },
        } as Sources & Record<Alias, NestedSource<Row, Binds>>;

        return new SerializedFromBuilder<
            Tables,
            Defs,
            Sources & Record<Alias, NestedSource<Row, Binds>>,
            ContextFrom<Tables, Sources & Record<Alias, NestedSource<Row, Binds>>>
        >(nextSources);
    }

    select<S extends SelectShape<Ctx, Defs>>(shape: S): SelectBuilder<Tables, Defs, Sources, Ctx, RowFromSelect<Ctx, Defs, S>, readonly []> {
        return new SerializedSelectBuilder<Tables, Defs, Sources, Ctx, RowFromSelect<Ctx, Defs, S>, readonly []>({
            from: this.sources as unknown as SerializedFromFor<Tables, Sources>,
            select: shape as unknown as SerializedQuery<SerializedFrom, RowFromSelect<Ctx, Defs, S>, readonly []>["select"],
        });
    }
}
