import { Condition, Expression, FilterRequest, FilterRequestNormalized, FunctionsType, SelectAttributes } from "@s-core/core";
import { QueryBuilder } from "./QueryBuilder.js";
import { SQLDialect } from "./SQLDialect.js";

export class SQLQueryBuilder<FuncDefs extends FunctionsType> implements QueryBuilder<FuncDefs> {

    constructor(
        readonly dialect: SQLDialect,
    ) { }

    buildSelect(req: FilterRequestNormalized<any, FuncDefs>, tables: string | { [alias: string]: string; }): { query: string; bind: unknown[]; } {
        const bind: unknown[] = [];
        const parts: string[] = [];

        const tableAlias = typeof tables === "string" ? { [tables]: tables } : tables;
        parts.push(this.select(req.attributes, bind));
        parts.push(this.from(tableAlias));

        if (req.where && req.where.length > 0) {
            parts.push(this.where(req.where, bind));
        }
        parts.push(this.groupBy(req.groupBy ?? [], bind));
        parts.push(this.orderBy(req.orderBy ?? [], bind));

        parts.push(this.limit(req.limit));
        parts.push(this.offset(req.offset));

        return { query: parts.join(" "), bind };
    }

    private resolveAttr<F extends Expression<any, any, FuncDefs>>(
        attr: F,
        bind: unknown[],
    ): string {
        if (typeof attr === "object" && "function" in attr && typeof attr.function === "string") {

            const resolved = [];
            if (Array.isArray(attr.params)) {
                for (const p in attr.params) {
                    const param = attr.params[p];
                    if (this.dialect.isImmediateParam(attr.function, Number(p))) {
                        if (typeof param === "object" && "value" in param)
                            resolved.push(String(param.value));
                        else {
                            throw new Error("Immediate parameter must be a value");
                        }
                    } else {
                        resolved.push(this.resolveAttr(param as Expression<any, any, FuncDefs>, bind));
                    }
                }
            }
            if (typeof attr.function !== "string") {
                throw new Error("Function name must be a string");
            }
            return this.dialect.function(attr.function, ...resolved);
        } else if (typeof attr === "string") {
            const t = attr.split(this.dialect.separator);
            return this.dialect.access(t[1] ?? t[0], t[1] ? t[0] : undefined);
        } else if (typeof attr === "object" && "value" in attr) {
            return this.dialect.bindParam(attr.value, bind);
        }
        throw new Error("Invalid attribute");
    }

    select<S extends SelectAttributes<any, FuncDefs>>(
        attrs: S | undefined,
        bind: unknown[],
    ): string {
        if (!attrs || attrs === null || Object.keys(attrs).length === 0) {
            return "SELECT * ";
        }
        const s = [];
        for (const newName in attrs) {
            const attr = attrs[newName];
            const sql = this.resolveAttr(attr, bind);
            s.push(this.dialect.rename(sql, newName));
        }
        return "SELECT " + s.join(",\n");
    }

    where(
        conditions: Condition<any, FuncDefs>[] | undefined,
        bind: unknown[],
    ): string {
        if (!conditions || conditions.length === 0) {
            return "";
        }
        const conditionStrings = conditions.map(cond => this.resolveAttr(cond as Condition, bind));
        return "WHERE " + conditionStrings.join(" AND ");
    }

    from(tables: { [alias: string]: string; }): string {
        const tableStrings = Object.entries(tables).map(([alias, table]) => {
            const tableName = this.dialect.quote(table);
            return this.dialect.rename(tableName, alias);
        });
        return "FROM " + tableStrings.join(", ");
    }

    orderBy(
        order: FilterRequest<any, FuncDefs>["orderBy"],
        bind: unknown[],
    ): string {
        if (!order || order.length === 0) {
            return "";
        }
        const orderStrings = order.map(o => {
            const attr = this.resolveAttr(o[0] as Expression, bind);
            return `${attr} ${o[1]}`;
        });
        return "ORDER BY " + orderStrings.join(", ");
    }

    groupBy(
        group: FilterRequest<any, FuncDefs>["groupBy"],
        bind: unknown[],
    ): string {
        if (!group || group.length === 0) {
            return "";
        }
        const groupStrings = group.map(g => this.resolveAttr(g as Expression, bind));
        return "GROUP BY " + groupStrings.join(", ");
    }

    limit(limit: number | undefined): string {
        if (limit === undefined) {
            return "";
        }
        return "LIMIT " + limit;
    }
    offset(offset: number | undefined): string {
        if (offset === undefined) {
            return "";
        }
        return "OFFSET " + offset;
    }
}
