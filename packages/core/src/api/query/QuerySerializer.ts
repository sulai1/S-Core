import { FunctionsType } from "../../module/index.js";
import { DataSourceSchema } from "../schema/datasource/DatasourceSchema.js";
import { SerializedFromBuilder } from "./SerializedFromBuilder.js";
import { ContextFrom, FromBuilder, FromMap } from "./index.js";


export class QuerySerializer<
    Tables extends DataSourceSchema,
    Defs extends FunctionsType = FunctionsType
> {
    from<Sources extends FromMap<Tables>>(
        sources: Sources
    ): FromBuilder<Tables, Defs, Sources, ContextFrom<Tables, Sources>> {
        return new SerializedFromBuilder<Tables, Defs, Sources, ContextFrom<Tables, Sources>>(sources);
    }
}
