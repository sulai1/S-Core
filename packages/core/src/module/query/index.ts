import { FunctionCall, FunctionsType } from "../index.js";

export * from "./Datasource.js";
export * from "./FilterModule.js";
export * from "./FilterRequest.js";
export * from "./Repository.js";
export * from "./SelectAttributes.js";
export * from "./SelectResult.js";

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
    FunctionCall<boolean, DataType, Defs> & {
        ignoreIfParamIsNull?: boolean;
    };
