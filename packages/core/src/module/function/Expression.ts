import { StringKeysOfType } from "../../generic.js";
import { FunctionCall } from "./FunctionCall.js";
import { FunctionsType } from "./FunctionsType.js";

export type Expression<
    ParamType = unknown,
    DataType extends Record<string, unknown> = Record<string, unknown>,
    Defs extends FunctionsType = FunctionsType
> = StringKeysOfType<DataType, ParamType> // Only property names that match the type
    |
    { value: ParamType; } // Direct value wrapper
    |
    FunctionCall<ParamType, DataType, Defs>;



