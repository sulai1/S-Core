import { DataSource, DefaultNamingStrategy, EntitySchema, QueryRunner } from "typeorm";
import { Condition, DataSource as DS, DataSourceSchema, FilterRequest, FunctionDefinitions, InferCreationSchema, InferFunctionTypes, Join, normalizeFilterRequest, Repository, SelectAttributes, SelectResult, TableCreationTypes, TableInstanceTypes, TablePrimaryKeyTypes, TableSchema } from "@s-core/core";
import { SQLDialect } from "./SQLDialect.js";
import { SQLQueryBuilder } from "./SQLQueryBuilder.js";

type DatabaseOptions<Tables, Functions extends FunctionDefinitions> = {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database: string;
    createDatabaseIfNotExists?: boolean;
    tables: Tables;
    functions: Functions;
    synchronize?: boolean;
    dialect: SQLDialect;
    queryBuilder?: SQLQueryBuilder<InferFunctionTypes<Functions>>;
}

class AsIsNamingStrategy extends DefaultNamingStrategy {
    tableName(targetName: string, userSpecifiedName: string | undefined): string {
        return userSpecifiedName ?? targetName;
    }
}

export class Database<
    Tables extends { [key: string]: TableSchema<any> } = Record<string, any>,
    Functions extends FunctionDefinitions = FunctionDefinitions,
> implements DS<Tables, InferFunctionTypes<Functions>> {
    private runner!: QueryRunner;
    private source: DataSource;
    private readonly options: DatabaseOptions<Tables, Functions>;
    readonly queryBuilder: SQLQueryBuilder<InferFunctionTypes<Functions>>;
    private readonly tableLookup: Record<keyof Tables, string>;

    constructor(options: DatabaseOptions<Tables, Functions>) {
        this.options = options;
        const supported = options.dialect.supportedFeatures(options.tables);
        const supportedSchema = this.normalizeSchemaForTypeOrm(supported);
        this.source = new DataSource({
            type: options.dialect.type,
            database: options.database,
            synchronize: options.synchronize ?? false,
            entities: Object.keys(supportedSchema).map(tableName =>
                new EntitySchema<TableSchema<any>>(supportedSchema[tableName])
            ),
            password: options.password,
            port: options.port,
            host: options.host,
            username: options.user,
            logging: true,
            namingStrategy: new AsIsNamingStrategy(),

        });
        this.tableLookup = {} as Record<keyof Tables, string>;
        for (const table in options.tables) {
            this.tableLookup[table] = options.tables[table].name;
        }
        this.queryBuilder = options.queryBuilder ?? new SQLQueryBuilder<InferFunctionTypes<Functions>>(
            options.dialect
        );
    }

    private normalizeSchemaForTypeOrm(schema: DataSourceSchema): DataSourceSchema {
        const normalized: DataSourceSchema = {};
        for (const tableName of Object.keys(schema)) {
            const table = schema[tableName];
            normalized[tableName] = table;
            for (const columnName of Object.keys(table.columns)) {
                const column = table.columns[columnName] as {
                    generated?: boolean | string;
                    createDate?: boolean;
                    updateDate?: boolean;
                    type?: unknown;
                };
                if (column.generated === "createdAt") {
                    delete column.generated;
                    column.createDate = true;
                    column.type = "timestamp without time zone";
                    continue;
                } else if (column.generated === "updatedAt") {
                    delete column.generated;
                    column.updateDate = true;
                    column.type = "timestamp without time zone";
                } else if (column.generated === "uuid") {
                    column.generated = "uuid";
                    column.type = "uuid";
                    continue;
                } else if (column.generated === "increment" || column.generated === true) {
                    column.generated = "increment";
                    column.type = "int";
                    continue;
                } else if (column.type === Date) {
                    column.type = "varchar";
                } else if (column.type === String) {
                    column.type = "varchar";
                } else if (column.type === Number) {
                    column.type = "float";
                } else if (column.type === Boolean) {
                    column.type = "boolean";
                }
            }
        }
        return normalized;
    }

    private quoteIdentifier(identifier: string): string {
        return `"${identifier.replace(/"/g, '""')}"`;
    }

    private isMissingDatabaseError(error: unknown): boolean {
        if (!error || typeof error !== "object") {
            return false;
        }
        const err = error as { code?: string; message?: string };
        return err.code === "3D000" || (typeof err.message === "string" && /database .+ does not exist/i.test(err.message));
    }

    private async ensureDatabaseExists(): Promise<void> {
        if (!(this.options.createDatabaseIfNotExists ?? true) || this.options.dialect.type !== "postgres") {
            return;
        }

        const targetDatabase = this.options.database;

        const adminSource = new DataSource({
            type: "postgres",
            host: this.options.host,
            port: this.options.port,
            username: this.options.user,
            password: this.options.password,
            database: "postgres",
            logging: false,
        });

        try {
            await adminSource.initialize();
            const existing = await adminSource.query<{ datname: string }[]>(
                "SELECT datname FROM pg_database WHERE datname = $1",
                [targetDatabase]
            );
            if (existing.length === 0) {
                const quotedDatabaseName = this.quoteIdentifier(targetDatabase);
                await adminSource.query(`CREATE DATABASE ${quotedDatabaseName}`);
            }
            return;
        } catch (error) {
            throw error;
        } finally {
            if (adminSource.isInitialized) {
                await adminSource.destroy();
            }
        }
    }

    async connect(): Promise<void> {
        await this.ensureDatabaseExists();
        await this.source.initialize();
        this.runner = this.source.createQueryRunner();
        await this.runner.connect();
    }

    async close(): Promise<void> {
        await this.runner.release();
        if (this.source.isInitialized)
            await this.source.destroy();
    }

    async get<T extends keyof Tables>(table: T, pk: TablePrimaryKeyTypes<Tables>[T]): Promise<TableInstanceTypes<Tables>[T] | null> {
        const conditions = Object.entries(pk).map(([key, value]) => ({
            function: "=",
            params: [key, { value }],
        }) as Condition<TableInstanceTypes<Tables>[T]>);
        const res = await this.find(table, { where: conditions });
        return res[0] as TableInstanceTypes<Tables>[T] | null;
    }

    createRepository<T extends keyof Tables>(table: T): Repository<Tables[T], InferFunctionTypes<Functions>> {
        return {
            async get(pk: TablePrimaryKeyTypes<Tables>[T]): Promise<TableInstanceTypes<Tables>[T] | null> {
                const conditions = Object.entries(pk).map(([key, value]) => ({
                    function: "=",
                    params: [key, { value }],
                }) as Condition<TableInstanceTypes<Tables>[T]>);
                return (await this.find({ where: conditions }))[0] as TableInstanceTypes<Tables>[T] | null;
            },
            create: async (data: TableCreationTypes<Tables>[T]) => (await this.insert(table, [data]))[0] as Promise<TablePrimaryKeyTypes<Tables>[T]>,
            update: async (
                value: Partial<TableInstanceTypes<Tables>[T]> & TablePrimaryKeyTypes<Tables>[T],
            ) => {
                const where: Condition<TableCreationTypes<Tables>[T], InferFunctionTypes<Functions>>[] = [];
                for (const key of Object.keys(value) as (keyof TablePrimaryKeyTypes<Tables>[T])[]) {
                    if (key in value) {
                        where.push({
                            function: "=",
                            params: [key, { value: value[key] }],
                        } as Condition<TableCreationTypes<Tables>[T], InferFunctionTypes<Functions>>);
                    }
                }
                await this.update(table, value, where);
            },
            delete: async (...where: Condition<TableCreationTypes<Tables>[T], InferFunctionTypes<Functions>>[]) => {
                await this.delete(table, where);
            },
            find: (req) => this.find(table, req as any),
            findOne: async (req) => {
                const res = await this.find(table, req as any);
                return res[0] as TableInstanceTypes<Tables>[T] | undefined;
            }
        };
    }

    async query<T>(sql: string, options?: { bind?: unknown[] }): Promise<T> {
        const res = await this.source.query<T>(sql, options?.bind);
        return res;
    }

    async update<T extends keyof Tables>(
        table: T,
        data: Partial<TableInstanceTypes<Tables>[T]>,
        where: Condition<Required<TableInstanceTypes<Tables>[T]>, InferFunctionTypes<Functions>>[]
    ): Promise<void> {
        const bind = [] as unknown[];
        const setParts: string[] = [];
        for (const key in data) {
            const value = data[key];
            const param = this.queryBuilder.dialect.bindParam(value, bind);
            setParts.push(`${this.queryBuilder.dialect.access(key)} = ${param}`);
        }
        const whereClause = this.queryBuilder.where(where, bind);
        const tableName = this.tableLookup[table];
        const sql = `UPDATE ${this.queryBuilder.dialect.quote(tableName as string)} SET ${setParts.join(", ")} ${whereClause ?? ""}`;
        await this.source.query(sql, bind);
    }

    async delete<T extends keyof Tables>(table: T, where: Condition<Required<TableInstanceTypes<Tables>[T]>, InferFunctionTypes<Functions>>[]): Promise<void> {
        const tableName = this.tableLookup[table];
        const bind = [] as unknown[];
        const whereClause = this.queryBuilder.where(where, bind);
        const sql = `DELETE FROM ${this.queryBuilder.dialect.quote(tableName as string)} ${whereClause ?? ""}`;
        await this.source.query(sql, bind);
    }

    async find<T extends keyof Tables, S extends SelectAttributes<TableInstanceTypes<Tables>[T], InferFunctionTypes<Functions>> | (keyof TableInstanceTypes<Tables>[T])[] | undefined = undefined>(
        table: T,
        req: FilterRequest<TableInstanceTypes<Tables>[T], InferFunctionTypes<Functions>, S>
    ): Promise<SelectResult<TableInstanceTypes<Tables>[T], InferFunctionTypes<Functions>, S>> {
        const tableName = this.tableLookup[table];
        if (typeof tableName !== "string") {
            throw new Error("Table name must be a string");
        }
        const sql = this.queryBuilder.buildSelect(normalizeFilterRequest(req), tableName);
        return await this.source.query(sql.query, sql.bind);
    }

    private buildDefaultJoinAttributes<T extends { [key: string]: keyof Tables & string }>(
        tables: T,
    ): SelectAttributes<Join<TableInstanceTypes<Tables>, T>, InferFunctionTypes<Functions>> {
        const attributes = {} as SelectAttributes<Join<TableInstanceTypes<Tables>, T>, InferFunctionTypes<Functions>>;

        for (const alias in tables) {
            const tableKey = tables[alias];
            const schema = this.options.tables[tableKey];
            for (const column of Object.keys(schema.columns)) {
                const key = `${alias}.${column}`;
                (attributes as Record<string, string>)[key] = key;
            }
        }

        return attributes;
    }

    async select<T extends {
        [key: string]: keyof Tables & string;
    }, S extends SelectAttributes<Join<TableInstanceTypes<Tables>, T>, InferFunctionTypes<Functions>> | (keyof Join<TableInstanceTypes<Tables>, T>)[] | undefined = undefined>(
        tables: T,
        req: FilterRequest<Join<TableInstanceTypes<Tables>, T>, InferFunctionTypes<Functions>, S>
    ): Promise<SelectResult<Join<TableInstanceTypes<Tables>, T>, InferFunctionTypes<Functions>, S>> {
        const tableNames = {} as Record<keyof T, string>;
        for (const alias in tables) {
            const table = tables[alias];
            if (typeof table !== "string") {
                throw new Error("Table name must be a string");
            }
            tableNames[alias] = this.tableLookup[table];
        }
        const normalizedReq = normalizeFilterRequest(req);
        if (Object.keys(normalizedReq.attributes).length === 0) {
            normalizedReq.attributes = this.buildDefaultJoinAttributes(tables);
        }

        const query = this.queryBuilder.buildSelect(normalizedReq, tableNames);
        const res = await this.source.query<SelectResult<Join<TableInstanceTypes<Tables>, T>, InferFunctionTypes<Functions>, S>>(query.query, query.bind);
        return res;
    }

    async insert<T extends keyof Tables>(
        table: T,
        data: InferCreationSchema<Tables[T]>[],
    ): Promise<TablePrimaryKeyTypes<Tables>[T][]> {
        const tableName = this.tableLookup[table];
        if (typeof tableName !== "string" || tableName.length === 0) {
            throw new Error(`Unknown table key '${String(table)}'`);
        }

        const result = await this.source
            .createQueryBuilder()
            .insert()
            .into(tableName)
            .values(data as any[])
            .execute();
        return result.identifiers as TablePrimaryKeyTypes<Tables>[T][];
    }

}
