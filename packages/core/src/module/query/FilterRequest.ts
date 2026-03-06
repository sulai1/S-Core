import { FunctionCall, FunctionsType } from "../function/index.js";
import { SelectAttributes } from "./SelectAttributes.js";
import { Condition } from "./index.js";


/**
 * FilterRequest is used to define the structure of a filtering request for querying data.
 * It includes optional properties for specifying conditions, selected attributes, renaming,
 * ordering, pagination limit, and offset.
 * @param DataType - The type of data being queried.
 * @param Defs - The function definitions available for use in conditions and ordering.
 * @param Attributes - The attributes to be selected, which can include renaming.
 * @returns An object representing the filter request structure.
 */
export type FilterRequestNormalized<
    DataType extends Record<string, unknown> = Record<string, unknown>,
    Defs extends FunctionsType = FunctionsType,
    Attributes extends SelectAttributes<DataType, Defs> = SelectAttributes<DataType, Defs>
> = {
    where: Condition<Required<DataType>, Defs>[];
    attributes: Attributes;
    orderBy?: ([FunctionCall<any, Required<DataType>, Defs> | Extract<keyof Required<DataType>, string>, "asc" | "desc"])[];
    groupBy?: (FunctionCall<any, Required<DataType>, Defs> | Extract<keyof Required<DataType>, string>)[];
    limit?: number;
    offset?: number;
};

/**
 * FilterRequestExtension is a more flexible version of FilterRequest that allows for
 * additional types of inputs for the 'where' and 'attributes' properties.
 * @param DataType - The type of data being queried.
 * @param Defs - The function definitions available for use in conditions and ordering.
 * @param Attributes - The attributes to be selected, which can include renaming or be an array of keys.
 * @returns An object representing the extended filter request structure.
 */
export type FilterRequest<
    DataType extends Record<string, unknown>,
    Defs extends FunctionsType,
    Attributes extends SelectAttributes<DataType, Defs> | (keyof DataType)[] | undefined = undefined
> = {
    where?: Condition<DataType, Defs>[] | Partial<DataType>;
    attributes?: Attributes;
    orderBy?: ([FunctionCall<any, DataType, Defs> | Extract<keyof DataType, string>, "asc" | "desc"])[];
    groupBy?: (FunctionCall<any, Required<DataType>, Defs> | Extract<keyof Required<DataType>, string>)[];
    limit?: number;
    offset?: number;
};

export function normalizeFilterRequest<
    DataType extends Record<string, unknown>,
    Defs extends FunctionsType,
    Attributes extends SelectAttributes<DataType, Defs> | (keyof DataType)[] | undefined = undefined
>(
    req: FilterRequest<DataType, Defs, Attributes>
): FilterRequestNormalized<DataType, Defs, SelectAttributes<DataType, Defs>> {
    const normalized: FilterRequestNormalized<DataType, Defs, SelectAttributes<DataType, Defs>> = {
        where: [],
        attributes: {} as SelectAttributes<DataType, Defs>,
        orderBy: req.orderBy || [],
        groupBy: req.groupBy || [],
        limit: req.limit,
        offset: req.offset,
    };

    if (req.where) {
        if (Array.isArray(req.where)) {
            normalized.where = req.where;
        } else {
            normalized.where = Object.entries(req.where).map(([key, value]) => ({
                function: "=",
                params: [key, { value }],
            }) as Condition<DataType, Defs>);
        }
    }

    if (req.attributes) {
        if (Array.isArray(req.attributes)) {
            normalized.attributes = req.attributes.reduce((acc, curr) => {
                if (typeof curr === 'string') {
                    acc[curr] = curr as Extract<keyof DataType, string>;
                }
                return acc;
            }, {} as SelectAttributes<DataType, Defs>);
        } else {
            normalized.attributes = req.attributes;
        }
    }

    return normalized;
}