import { Condition, DataSource, DataSourcePaths, DataSourceSchema, FilterRequest, FilterRequestNormalized, FunctionsType, InferCreationSchema, InferPrimaryKey, InferTableSchema, OpenApiModule } from "@s-core/core";

/**
 * Creates a server-side OpenAPI module implementation for a DataSource.
 * This automatically generates all the endpoint handlers (/get, /insert, /update, /delete, /find, /select)
 * from a DataSource instance, eliminating boilerplate code.
 *
 * @template Tables - The datasource schema type
 * @template Functions - The function definitions type
 *
 * @param datasource - The DataSource instance to wrap
 * @returns An OpenApiModule implementation for DataSourcePaths
 *
 * @example
 * ```typescript
 * const db = new Database({ tables, ... });
 * 
 * app.getModule("server").add<DataSourcePaths<typeof db>>(
 *   "/data",
 *   createDatasourceSchema("/data", tables),
 *   createDatasourceServer(db)
 * );
 * ```
 */
export function createDatasourceServer<
    Tables extends DataSourceSchema,
    Functions extends FunctionsType = FunctionsType
>(
    datasource: DataSource<Tables, Functions>
): OpenApiModule<DataSourcePaths<DataSource<Tables, Functions>>> {
    return {
        "/get": {
            post: async <K extends keyof Tables>(req: { table: K; key: InferPrimaryKey<Tables[K]> }, options: object) => {
                try {
                    return await datasource.get(req.table, req.key);
                } catch (error) {
                    console.error(`[GET] Error fetching from table '${String(req.table)}' with key:`, req.key, error);
                    throw error;
                }
            }
        },
        "/insert": {
            post: async <K extends keyof Tables>(req: { table: K; data: InferCreationSchema<Tables[K]>[] }) => {
                try {
                    return await datasource.insert(req.table, req.data);
                } catch (error) {
                    console.error(`[INSERT] Error inserting into table '${String(req.table)}':`, error);
                    throw error;
                }
            }
        },
        "/update": {
            post: async <K extends keyof Tables>(req: {
                table: K;
                data: Partial<InferTableSchema<Tables[K]>>;
                where: Condition<InferTableSchema<Tables[K]>, Functions>[]
            }) => {
                try {
                    await datasource.update(req.table, req.data, req.where);
                } catch (error) {
                    console.error(`[UPDATE] Error updating table '${String(req.table)}':`, error);
                    throw error;
                }
            }
        },
        "/delete": {
            post: async <K extends keyof Tables>(req: {
                table: K;
                where: Condition<InferTableSchema<Tables[K]>, Functions>[]
            }) => {
                try {
                    await datasource.delete(req.table, req.where);
                } catch (error) {
                    console.error(`[DELETE] Error deleting from table '${String(req.table)}':`, error);
                    throw error;
                }
            }
        },
        "/find": {
            post: async <K extends keyof Tables>(req: {
                table: K;
                query: FilterRequest<InferTableSchema<Tables[K]>, Functions, any>
            }) => {
                try {
                    console.log(`[FIND] Executing find on table '${String(req.table)}' with query:`, JSON.stringify(req.query, null, 2));
                    return await datasource.find(req.table, req.query);
                } catch (error) {
                    console.error(`[FIND] Error finding records in table '${String(req.table)}':`, error);
                    throw error;
                }
            }
        },
        "/select": {
            post: async <T extends { [key: string]: keyof Tables & string }>(req: {
                tables: T;
                query: FilterRequestNormalized<any, Functions, any>
            }) => {
                try {
                    return await datasource.select(req.tables, req.query);
                } catch (error) {
                    console.error(`[SELECT] Error selecting from tables:`, Object.keys(req.tables), error);
                    throw error;
                }
            }
        }
    } as OpenApiModule<DataSourcePaths<DataSource<Tables, Functions>>>;
}
