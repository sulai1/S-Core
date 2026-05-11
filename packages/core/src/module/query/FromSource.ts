import { DataSourceSchema, TableInstanceTypes } from "../../api/schema/datasource/index.js";
import { FilterRequest } from "./FilterRequest.js";
import { FunctionsType } from "../function/FunctionsType.js";
import { SelectAttributes } from "./SelectAttributes.js";

/**
 * A FROM source that references a table by key
 */
export type FromTableSource<TableKey extends string = string> = {
    kind: "table";
    table: TableKey;
};

/**
 * A FROM source that is itself a nested select query.
 * The generic parameters capture the structure of the nested query.
 * 
 * @template NestedTables The schema of tables available to the nested select
 * @template NestedTableMap The alias -> table key mapping for the nested select
 * @template NestedFunctions The function definitions available in the nested select
 * @template NestedAttributes The selected attributes/projections from the nested select
 */
export type FromNestedSelectSource<
    NestedTables extends DataSourceSchema = DataSourceSchema,
    NestedTableMap extends Record<string, keyof NestedTables & string> = Record<string, keyof NestedTables & string>,
    NestedFunctions extends FunctionsType = FunctionsType,
    NestedAttributes extends SelectAttributes<any, NestedFunctions> | (keyof any)[] | undefined = undefined
> = {
    kind: "nested";
    tables: NestedTableMap;
    query: FilterRequest<any, NestedFunctions, NestedAttributes>;
};

/**
 * A FROM source can be either a table key (string shorthand), a table source object, or a nested select source.
 */
export type FromSource<TableKey extends string = string> =
    | TableKey
    | FromTableSource<TableKey>
    | FromNestedSelectSource<any, any, any, any>;

/**
 * A record mapping aliases to FROM sources.
 * Allows mix of table keys and nested select definitions.
 */
export type DataSourceSelectSources<Tables extends DataSourceSchema> = Record<
    string,
    FromSource<keyof Tables & string>
>;

/**
 * Utility type to merge overlapping records into a single flat record.
 * Used to combine multiple aliased schemas into one.
 */
type Merge<U> = (
    U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
    ? { [K in keyof I]: I[K] }
    : never;

/**
 * For a given source (table key, table source, or nested source),
 * resolve what columns it produces.
 * 
 * - String keys resolve to the table instance schema
 * - Table sources resolve to their referenced table schema
 * - Nested sources resolve to their inferred result schema
 *   (for now, this requires the nested source to have explicit attributes or be marked with a result type)
 */
type ResolveSourceColumns<
    AllTableInstances extends Record<string, Record<string, unknown>>,
    Source
> =
    Source extends keyof AllTableInstances & string
    ? AllTableInstances[Source]
    : Source extends FromTableSource<infer TableKey>
    ? TableKey extends keyof AllTableInstances & string
    ? AllTableInstances[TableKey]
    : never
    : Source extends FromNestedSelectSource<
        infer NestedTables,
        infer NestedTableMap,
        infer NestedFunctions,
        infer NestedAttributes
    >
    ? NestedAttributes extends SelectAttributes<any, NestedFunctions>
    ? {
        [K in keyof NestedAttributes & string]: NestedAttributes[K] extends string
        ? never // Column references need to resolve through nested join
        : unknown // Function calls have unknown return type without function defs lookup
    }
    : NestedAttributes extends (keyof any)[]
    ? {
        [K in NestedAttributes[number] & string]: unknown
    }
    : unknown // No attributes specified, unknown result
    : never;

/**
 * Given a map of FROM sources (mixed tables and nested selects),
 * compute the flattened schema with alias.column keys.
 * 
 * Each alias is prefixed to all its columns:
 * - `a: "TableA"` produces columns `a.id`, `a.name`, etc.
 * - `nested: { tables: { b: "B" }, query: { attributes: { x: "b.id" } } }` produces `nested.x`
 */
export type JoinFromSources<
    AllTableInstances extends Record<string, Record<string, unknown>>,
    Sources extends Record<string, any>
> = Merge<{
    [Alias in keyof Sources & string]: ResolveSourceColumns<AllTableInstances, Sources[Alias]> extends infer SourceColumns
    ? SourceColumns extends Record<string, unknown>
    ? {
        [Column in keyof SourceColumns & string as `${Alias}.${Column}`]: SourceColumns[Column]
    }
    : never
    : never;
}[keyof Sources & string]>;

/**
 * Compute the full result schema for a datasource select with mixed table and nested select sources.
 * 
 * @template Tables The outer datasource schema
 * @template Sources The FROM source map (aliases to sources)
 * @returns The flattened schema with alias.column keys representing all available columns
 */
export type SelectDataForSources<
    Tables extends DataSourceSchema,
    Sources extends DataSourceSelectSources<Tables>
> = JoinFromSources<TableInstanceTypes<Tables>, Sources>;

/**
 * Helper to construct a table source explicitly.
 */
export function fromTable<TableKey extends string>(table: TableKey): FromTableSource<TableKey> {
    return { kind: "table", table };
}

/**
 * Helper to construct a nested select source.
 * 
 * @example
 * ```typescript
 * fromNestedSelect({ b: "TableB" }, { attributes: { x: "b.id" } })
 * ```
 */
export function fromNestedSelect<
    NestedTables extends DataSourceSchema,
    NestedTableMap extends Record<string, keyof NestedTables & string>,
    NestedFunctions extends FunctionsType,
    NestedAttributes extends SelectAttributes<any, NestedFunctions> | (keyof any)[] | undefined = undefined
>(
    tables: NestedTableMap,
    query: FilterRequest<any, NestedFunctions, NestedAttributes>,
): FromNestedSelectSource<NestedTables, NestedTableMap, NestedFunctions, NestedAttributes> {
    return { kind: "nested", tables, query };
}
