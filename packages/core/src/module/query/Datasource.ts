import { Condition, FilterRequest, FilterRequestNormalized, FunctionsType, Repository, SelectAttributes, SelectResult } from "..";
import { DataSourceSchema, InferCreationSchema, InferPrimaryKey, InferTableSchema, TableInstanceTypes } from "../../api/schema/datsource";
import { Join } from "../../generic";

export type DataSource<
    Tables extends DataSourceSchema = {},
    Functions extends FunctionsType = FunctionsType,
> = {
    get<T extends keyof Tables>(table: T, key: InferPrimaryKey<Tables[T]>): Promise<InferTableSchema<Tables[T]> | null>;
    insert: <T extends keyof Tables>(
        table: T, data: InferCreationSchema<Tables[T]>[],
    ) => Promise<InferPrimaryKey<Tables[T]>[]>;
    update: <T extends keyof Tables>(table: T, data: Partial<InferTableSchema<Tables[T]>>, where: Condition<InferTableSchema<Tables[T]>, Functions>[]) => Promise<void>;
    delete: <T extends keyof Tables>(table: T, where: Condition<InferTableSchema<Tables[T]>, Functions>[]) => Promise<void>;
    find: <T extends keyof Tables, S extends SelectAttributes<InferTableSchema<Tables[T]>, Functions> | (keyof InferTableSchema<Tables[T]>)[] | undefined = undefined> (
        table: T,
        query: FilterRequest<InferTableSchema<Tables[T]>, Functions, S>,
    ) => Promise<SelectResult<InferTableSchema<Tables[T]>, Functions, S>>;
    select<
        T extends { [key: string]: keyof Tables & string },
        S extends SelectAttributes<Join<TableInstanceTypes<Tables>, T>, Functions>>(
            tables: T,
            query: FilterRequestNormalized<Join<TableInstanceTypes<Tables>, T>, Functions, S>,
        ): Promise<SelectResult<Join<TableInstanceTypes<Tables>, T>, Functions, S>>;
    createRepository: <T extends keyof Tables>(table: T) => Repository<Tables[T], Functions>;
}