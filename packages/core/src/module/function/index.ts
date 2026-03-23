import { InferFunctionTypes } from "./FunctionsType.js";

export * from "./Expression.js";
export * from "./FunctionCall.js";
export * from "./FunctionsType.js";


export const mathFunctionDefinitions = {
    "+": [[Number, Number, Number]] as const,
    "*": [[Number, Number, Number]] as const,
    "-": [[Number, Number, Number]] as const,
    "/": [[Number, Number, Number]] as const,
    round: [[Number, Number, Number], [Number, Number]] as const,
} as const;

export const stringFunctionDefinitions = {
    concat: [[String, String, String]] as const,
    toUpper: [[String, String]],
    toLower: [[String, String]],
    substring: [[String, Number, Number, String] as const] as const,
} as const;

export const dateFunctionDefinitions = {
    date_part: [[String, String, String]] as const,
    date_trunc: [[String, String, String]] as const,
} as const;

export const aggregateFunctionDefinitions = {
    sum: [[Number, Number] as const] as const,
    avg: [[Number, Number] as const] as const,
    count: [[Object, Number] as const, [Number] as const] as const,
    max: [[Number, Number] as const, [String, String] as const, [Date, Date] as const] as const,
    min: [[Number, Number] as const, [String, String] as const, [Date, Date] as const] as const,
} as const;

export const utilityFunctions = {
    cast: [[() => "" as any, String, () => "" as any]] as const,
    coalesce: [[String, String, String] as const, [Number, Number, Number] as const, [Boolean, Boolean, Boolean] as const, [Date, Date, Date] as const] as const,
} as const;

export const booleanFunctionDefinitions = {
    "<": [[Number, Number, Boolean] as const, [String, String, Boolean] as const, [Boolean, Boolean, Boolean] as const] as const,
    "<=": [[Number, Number, Boolean] as const, [String, String, Boolean] as const, [Boolean, Boolean, Boolean] as const] as const,
    ">": [[Number, Number, Boolean] as const, [String, String, Boolean] as const, [Boolean, Boolean, Boolean] as const] as const,
    ">=": [[Number, Number, Boolean] as const, [String, String, Boolean] as const, [Boolean, Boolean, Boolean] as const] as const,
    "=": [[Number, Number, Boolean] as const, [String, String, Boolean] as const, [Boolean, Boolean, Boolean] as const] as const,
    "and": [[Boolean, Boolean, Boolean] as const] as const,
    "or": [[Boolean, Boolean, Boolean] as const] as const,
    "not": [[Boolean, Boolean] as const] as const,
    "in": [[Number, Array, Boolean] as const, [String, Array, Boolean] as const, [Date, Array, Boolean] as const] as const,
    "like": [[String, String, Boolean] as const] as const,
    "~": [[String, String, Boolean] as const] as const,
    "between": [[String, String, String, Boolean] as const, [Number, Number, Number, Boolean] as const, [Date, Date, Date, Boolean] as const] as const,
} as const;

export type MathFunctionDefinitions = InferFunctionTypes<typeof mathFunctionDefinitions>;
export type StringFunctionDefinitions = InferFunctionTypes<typeof stringFunctionDefinitions>;
export type DateFunctionDefinitions = InferFunctionTypes<typeof dateFunctionDefinitions>;
export type AggregateFunctionDefinitions = InferFunctionTypes<typeof aggregateFunctionDefinitions>;
export type UtilityFunctions = InferFunctionTypes<typeof utilityFunctions>;
export type BooleanFunctionDefinitions = InferFunctionTypes<typeof booleanFunctionDefinitions>;
// Combined function definitions
export type StandardFunctionDefinitions = MathFunctionDefinitions
    & StringFunctionDefinitions
    & DateFunctionDefinitions
    & BooleanFunctionDefinitions
    & UtilityFunctions;

export type SelectFunctionDefinitions = StandardFunctionDefinitions & AggregateFunctionDefinitions;

export const standardFunctionDefinitions = {
    ...mathFunctionDefinitions,
    ...dateFunctionDefinitions,
    ...stringFunctionDefinitions,
    ...booleanFunctionDefinitions,
    ...utilityFunctions,
};

export const selectFunctionDefinitions = {
    ...standardFunctionDefinitions,
    ...aggregateFunctionDefinitions,
};
