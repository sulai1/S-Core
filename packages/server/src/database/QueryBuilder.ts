import { FilterRequestNormalized, FunctionsType } from "@s-core/core";

export type QueryBuilder<Functions extends FunctionsType> = {
    buildSelect(
        req: FilterRequestNormalized<any, Functions>,
        tables: { [alias: string]: string }
    ): { query: string, bind: unknown[] };
}