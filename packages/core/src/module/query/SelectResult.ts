import { FunctionCall, FunctionReturnType, FunctionsType } from "../function";
import { SelectAttributes } from "./SelectAttributes";

/**
 * Infers the result type of a select query based on the selected attributes, renamed attributes, and function definitions.
 * @param DataType - The type of data being queried.
 * @param Defs - The function definitions available for use in selecting attributes.
 * @param SelectFuncs - The selected attributes with their corresponding types.
 * @returns An array of objects representing the result of the select query.
 */
type SelectResultBase<
    DataType extends Record<string, unknown>,
    Defs extends FunctionsType,
    SelectFuncs extends SelectAttributes<DataType, Defs>
> = {
    [K in keyof SelectFuncs]: SelectFuncs[K] extends FunctionCall<DataType, Defs, infer FuncName>
    ? FuncName extends keyof Defs
    ? FunctionReturnType<Defs[FuncName]>
    : never
    : never;
}[];

/**
 * SelectResultExtension is a more flexible version of SelectResult that allows for
 * additional types of inputs for the 'Attributes' parameter.
 * @param DataType - The type of data being queried.
 * @param Defs - The function definitions available for use in selecting attributes.
 * @param Attributes - The attributes to be selected, which can include renaming or be an array of keys.
 */
export type SelectResult<
    DataType extends Record<string, unknown>,
    Defs extends FunctionsType,
    Attributes extends SelectAttributes<DataType, Defs> | (keyof DataType)[] | undefined = undefined
> = (
        Attributes extends undefined
        ? DataType[]
        : Attributes extends (infer T)[]
        ? ({
            [K in T & keyof DataType]: DataType[K];
        }
        )[]
        : Attributes extends SelectAttributes<DataType, Defs>
        ? SelectResultBase<DataType, Defs, Attributes>
        : never
    );

