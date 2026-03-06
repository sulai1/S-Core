import { FunctionsType, InferCreationSchema, InferPrimaryKey, InferTableSchema, SelectFunctionDefinitions, TableSchema } from "../..";
import { FilterModule } from "./FilterModule";
/**
 * Defines a module for a CRUD query.
 * This module extends the FilterModuleExtension to include create, update, and delete operations.
 * @template T - The type of the query model.
 * @template F - The type of the function definitions.
 * @template C - The type of the create request model.
 */
export type Repository<
    T extends TableSchema,
    F extends FunctionsType = SelectFunctionDefinitions,
> = FilterModule<InferTableSchema<T>, F> & {
    get(pk: InferPrimaryKey<T>): Promise<InferTableSchema<T> | null>;
    /**
     * Creates new records in the database.
     * @param req - The request containing the records to create.
     * @returns A promise that resolves to the number of affected rows.
     */
    create(req: InferCreationSchema<T>): Promise<InferPrimaryKey<T>>;

    /**
     * Updates records in the database.
     * @param values - The values to update.
     * @returns A promise that resolves to the found records.
     */
    update(values: Partial<T> & InferPrimaryKey<T>): Promise<void>;

    /**
     * Deletes records from the database.
     * @param pks - The request containing the primary keys of the records to delete.
     * @returns A promise that resolves to the number of affected rows.
     */
    delete(pk: InferPrimaryKey<T>): Promise<void>;
};