import { FilterRequestNormalized, FunctionsType } from "@s-core/core";
import { SerializedQuery } from "../../../core/dist/cjs/src/api/query/SerializedQuery.js";

export type QueryBuilder<Functions extends FunctionsType> = {
    buildSelect(
        req: FilterRequestNormalized<any, Functions>,
        tables: { [alias: string]: string }
    ): { query: string, bind: unknown[] };
    build(query: SerializedQuery): { query: string, bind: unknown[] };
}