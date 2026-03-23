import { DataSourceSchema } from "@s-core/core";
import { SQLDialect } from "./SQLDialect.js";
import { isInfixFunction } from "./SqliteDialect.js";


export class PostgresDialect implements SQLDialect {
    readonly type = "postgres";
    private readonly tables: DataSourceSchema = {};
    readonly tableLookup: { [key: string]: string } = {};

    init(tables: DataSourceSchema) {
        for (const table of Object.keys(tables)) {
            this.tables[table] = tables[table];
            this.tableLookup[table] = tables[table].name;
        }
        return this;
    }
    table(name: string): string {
        return this.quote(this.tableLookup[name]);
    }
    quote(identifier: string): string {
        return `"${identifier.replace(/"/g, '""')}"`;
    }

    access(attribute: string, table?: string): string {
        if (table) {
            return `${this.quote(table)}.${this.quote(attribute)}`;
        }
        return this.quote(attribute);
    }

    rename(expr: string, newName: string): string {
        return `${expr} AS ${this.quote(newName)}`;
    }

    isImmediateParam(func: string, index: number): boolean {
        if (func === "cast" && index === 1) {
            return true;
        }
        else if (func === "date_trunc" && index === 0) {
            return true;
        } else if (func === "date_part" && index === 0) {
            return true;
        }
        return false;
    }


    function(name: string, ...args: any[]): string {
        if (typeof name !== "string") {
            throw new Error("Function name must be a string");
        }
        if (!/^[a-zA-Z0-9_]+$/.test(name) && !isInfixFunction(name as string)) {
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
        if (name === "in" && args.length === 2) {
            const field = args[0] as unknown;
            const valueList = args[1] as unknown[];
            return `${field} = ANY(${valueList})`;
        }
        if (name === "date_trunc" && args.length === 2) {
            return `DATE_TRUNC('${args[0]}', ${args[1]}::timestamp)`;
        }
        if (name === "date_part" && args.length === 2) {
            return `DATE_PART('${args[0]}', ${args[1]}::timestamp)`;
        }
        return `${name}(${args.join(", ")})`;
    }
    separator: string = ".";
    bindParam(value: unknown, bind: unknown[], type?: string): string {
        bind.push(value);
        return `$${bind.length}`;
    }
    supportedFeatures(schema: DataSourceSchema) {
        return schema;
    }
}
