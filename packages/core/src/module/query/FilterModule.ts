
import { Condition, FunctionsType, SelectFunctionDefinitions } from "..";
import { FilterRequest } from "./FilterRequest";
import { SelectAttributes } from "./SelectAttributes";
import { SelectResult } from "./SelectResult";

/**
 * Defines a module for a filtering query. Allows for finding records based on conditions 
 * and transformations of attributes.
 * @template DataType - The type of the query model.
 * @template Defs - The type of the function definitions.
 */
export type FilterModule<
    DataType extends {},
    Defs extends FunctionsType = SelectFunctionDefinitions
> = {
    find<
        S extends SelectAttributes<DataType, Defs> | (keyof DataType)[] | undefined = undefined
    >(options: FilterRequest<DataType, Defs, S>): Promise<SelectResult<DataType, Defs, S>>;

    findOne<
        S extends SelectAttributes<DataType, Defs> | (keyof DataType)[] | undefined = undefined
    >(
        options: Omit<FilterRequest<DataType, Defs, S>, 'limit'>
    ): Promise<SelectResult<DataType, Defs, S>[number] | undefined>;
}

/**
 * extends a FilterModule to a FilterModule with more user-friendly methods.
 * @template DataType the type of the query model 
 * @template Defs the type of the function definitions
 * @param module the FilterModule to extend
 * @returns a FilterModule 
 */
export function extendFilterModule<
    DataType extends {},
    Defs extends FunctionsType = SelectFunctionDefinitions
>(
    module: FilterModule<DataType, Defs>
): FilterModule<DataType, Defs> {
    return {
        ...module,
        async find<Attributes extends SelectAttributes<DataType, Defs> | (keyof DataType)[] | undefined = undefined>(
            options: FilterRequest<DataType, Defs, Attributes>
        ): Promise<SelectResult<DataType, Defs, Attributes>> {
            const f: FilterRequest<DataType, Defs, SelectAttributes<DataType, Defs>> = {
                limit: options.limit,
                offset: options.offset,
                orderBy: options.orderBy
            };
            if (options.attributes && Array.isArray(options.attributes) && options.attributes.length > 0) {
                f.attributes = options.attributes.reduce((acc, curr) => {
                    if (typeof curr === 'string') {
                        acc[curr] = curr as Extract<keyof DataType, string>;
                    }
                    return acc;
                }, {} as SelectAttributes<DataType, Defs>);
            } else if (options.attributes && !Array.isArray(options.attributes)) {
                f.attributes = options.attributes as SelectAttributes<DataType, Defs>;
            } else {
                f.attributes = undefined;
            }
            if (options.where) {
                if (Array.isArray(options.where)) {
                    f.where = options.where;
                } else {
                    f.where = Object.entries(options.where).map(([key, value]) => {
                        return { function: "=", params: [key, { value }] } as Condition<DataType, Defs>;
                    });
                }
            }
            const result = await module.find(f);
            // Convert result to SelectResultExtension type if necessary
            return result as SelectResult<DataType, Defs, Attributes>;
        },

        async findOne<Attributes extends SelectAttributes<DataType, Defs> | (keyof DataType)[] | undefined = undefined>(options: Omit<FilterRequest<DataType, Defs, Attributes>, 'limit'>): Promise<SelectResult<DataType, Defs, Attributes>[number] | undefined> {
            const res = await this.find<Attributes>({ ...options, limit: 1 });
            return res.length > 0 ? res[0] : undefined;
        }
    };
}