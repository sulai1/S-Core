import { FunctionDefinitions, FunctionsType, SelectFunctionDefinitions } from "../../module/index.js";
import { DataSourceSchema } from "../schema/datasource/DatasourceSchema.js";
import { SerializedFromBuilder } from "./SerializedFromBuilder.js";
import { ContextFrom, FromBuilder, FromMap, NestedSource, SelectBuilder, SerializedFrom, SerializedQuery } from "./index.js";


export class QuerySerializer<
    Tables extends DataSourceSchema,
    Defs extends FunctionsType = SelectFunctionDefinitions
> {

    constructor(private tables: Tables, private defs?: FunctionDefinitions) { }

    from<Sources extends FromMap<Tables>>(
        sources: Sources
    ): FromBuilder<Tables, Defs, Sources, ContextFrom<Tables, Sources>> {
        return new SerializedFromBuilder<Tables, Defs, Sources, ContextFrom<Tables, Sources>>(sources);
    }

    lateralFrom<
        OuterSources extends FromMap<Tables>,
        Sources extends FromMap<Tables>,
        Ctx extends Record<string, unknown> = ContextFrom<Tables, Sources> & ContextFrom<Tables, OuterSources>,
        Row extends Record<string, unknown> = Record<string, unknown>,
        Binds extends readonly unknown[] = readonly unknown[]
    >(
        outerSources: OuterSources,
        sources: Sources,
        build: (from: FromBuilder<Tables, Defs, Sources, Ctx>) => SelectBuilder<Tables, Defs, Sources, Ctx, Row, Binds>,
    ): NestedSource<Row, Binds> {
        void outerSources;
        const nestedFrom = new SerializedFromBuilder<Tables, Defs, Sources, Ctx>(sources);
        const query = build(nestedFrom).build();
        return {
            query: query as unknown as SerializedQuery<SerializedFrom, Row, Binds>,
            lateral: true,
        };
    }
}
