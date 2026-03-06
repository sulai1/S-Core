import { DataSourceSchema } from "@s-core/core";
import { SQLDialect } from "./SQLDialect";

export function isInfixFunction(name: string) {
    return ["+", "-", "*", "/", "||", "=", "<", ">", "<=", ">=", "!=", "~", "like", "and", "or"].includes(name);
}

export class SqliteDialect implements SQLDialect {
    readonly type = "sqlite";

    table(name: string): string {
        return this.quote(name);
    }
    quote(identifier: string): string {
        return `"${identifier.replace(/"/g, '""')}"`;
    }

    access(attribute: string, table?: string, tableAlias?: { [alias: string]: string; }): string {
        if (table) {
            const actualTable = tableAlias ? tableAlias[table] : table;
            return `${this.table(actualTable)}.${this.quote(attribute)}`;
        }
        return this.quote(attribute);
    }

    rename(expr: string, newName: string): string {
        return `${expr} AS "${newName}"`;
    }

    function(name: string, ...args: any[]): string {
        if (typeof name !== "string") {
            throw new Error("Function name must be a string");
        }
        if (!/^[a-zA-Z0-9_]+$/.test(name) && !isInfixFunction(name)) {
            throw new Error("Function name must be alphanumeric");
        }

        if (isInfixFunction(name as string)) {
            return `(${args.join(` ${name} `)})`;
        }
        if (name === "between" && args.length === 3) {
            return `(${args[0]} BETWEEN ${args[1]} AND ${args[2]})`;
        }
        if (name === "cast" && args.length === 2) {
            return `CAST(${args[0]} AS ${args[1]})`;
        }
        if (name === "toUpper" && args.length === 1) {
            return `UPPER(${args[0]})`;
        }
        if (name === "toLower" && args.length === 1) {
            return `LOWER(${args[0]})`;
        }
        return `${name}(${args.join(", ")})`;
    }
    separator: string = ".";
    bindParam(value: unknown, bind: unknown[], type?: string): string {
        bind.push(value);
        return `$${bind.length}`;
    }
    supportedFeatures(schema: DataSourceSchema): DataSourceSchema {
        const supported: DataSourceSchema = {};
        for (const table in schema) {
            const tableDef = schema[table];
            for(const column of Object.keys(tableDef.columns) as (keyof typeof tableDef.columns)[]) {
                if (tableDef.columns[column].generated) {
                    console.warn(`Column ${table}.${column} is generated, which is not supported by SQLite. This column will be ignored.`);
                    delete tableDef.columns[column].generated;
                }
            }
            supported[table] = tableDef;
        }
        return schema;
    }
}
