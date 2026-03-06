import { FunctionCall } from "../function";
import { FunctionsType } from "../function/FunctionsType";

/**
 * SelectAttributes is a utility type that defines the structure for selecting and renaming attributes 
 * from a data type, allowing for both direct attribute selection and function calls.
 * @param DataType - The type of data being queried.
 * @param Defs - The function definitions available for use in selecting attributes.
 * @returns A type representing the selected attributes with their corresponding types.
 */
export type SelectAttributes<
    DataType extends Record<string, unknown> = Record<string, unknown>,
    Defs extends FunctionsType = FunctionsType
> = {
        [ResultName in string]: {
            [FuncName in keyof Defs]: FunctionCall<any, DataType, Defs> | Extract<keyof DataType, string>;
        }[keyof Defs];
    };

export type KeysOfType<
    Obj extends object,
    TargetType
> = {
    [K in keyof Obj]: Obj[K] extends TargetType ? K : never;
}[keyof Obj];