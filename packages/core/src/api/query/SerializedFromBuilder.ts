import { FunctionsType } from "../../module/index.js";
import { DataSourceSchema } from "../schema/datasource/DatasourceSchema.js";
import { SerializedSelectBuilder } from "./SerializedSelectBuilder.js";
import { createExprFactory } from "./Expression.js";
import { FromMap, FromBuilder, SelectShape, SelectBuilder, RowFromSelect, SerializedFromFor } from "./index.js";

export class SerializedFromBuilder<
    Tables extends DataSourceSchema,
    Defs extends FunctionsType,
    Sources extends FromMap<Tables>,
    Ctx extends Record<string, unknown>> implements FromBuilder<Tables, Defs, Sources, Ctx> {
    readonly expr = createExprFactory<Ctx, Defs>();

    constructor(private readonly sources: Sources) { }

    select<S extends SelectShape<Ctx, Defs>>(shape: S): SelectBuilder<Tables, Defs, Sources, Ctx, RowFromSelect<Ctx, Defs, S>, readonly []> {
        return new SerializedSelectBuilder<Tables, Defs, Sources, Ctx, RowFromSelect<Ctx, Defs, S>, readonly []>({
            from: this.sources as unknown as SerializedFromFor<Tables, Sources>,
            select: shape,
        });
    }
}
