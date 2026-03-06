import { FunctionCall, FunctionsType } from "../..";

export * from "./Datasource";
export * from "./FilterModule";
export * from "./FilterRequest";
export * from "./Repository";
export * from "./SelectAttributes";
export * from "./SelectResult";

/**
 * Condition type utility to define conditions for filtering data. 
 * A condition is represented as a function call that returns a boolean value.
 * 
 * @param Defs - The function definitions available for use in conditions.
 * @param DataType - The type of data being queried.
 * @returns A type representing a condition that evaluates to a boolean.
 * 
 */
export type Condition<DataType extends Record<string, unknown> = Record<string, unknown>, Defs extends FunctionsType = FunctionsType> =
    FunctionCall<boolean, DataType, Defs>;
