import { StringKeysOfType } from "../../generic";
import { FunctionCall } from "./FunctionCall";
import { FunctionsType } from "./FunctionsType";

export type Expression<
    ParamType = unknown,
    DataType extends Record<string, unknown> = Record<string, unknown>,
    Defs extends FunctionsType = FunctionsType
> = StringKeysOfType<DataType, ParamType> // Only property names that match the type
    |
    { value: ParamType; } // Direct value wrapper
    |
    FunctionCall<ParamType, DataType, Defs>;



