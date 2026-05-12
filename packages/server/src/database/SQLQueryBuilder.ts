import { Condition, Expression, FilterRequest, FilterRequestNormalized, FunctionsType, SelectAttributes, SerializedExpression, SerializedQuery } from "@s-core/core";
import { QueryBuilder } from "./QueryBuilder.js";
import { SQLDialect } from "./SQLDialect.js";

export class SQLQueryBuilder<Functions extends FunctionsType> implements QueryBuilder<Functions> {

    constructor(
        readonly dialect: SQLDialect,
    ) { }

    build(query: SerializedQuery): { query: string; bind: unknown[]; } {
        const bind: unknown[] = [];
        return { query: this.buildQuery(query, bind), bind };
    }

    private buildQuery(query: SerializedQuery, bind: unknown[]): string {
        const parts: string[] = [];

        // SELECT
        if (!query.select || Object.keys(query.select).length === 0) {
            parts.push("SELECT *");
        } else {
            const attrs = Object.entries(query.select).map(([alias, expr]) =>
                this.dialect.rename(this.resolveSerializedExpr(expr, bind), alias)
            );
            parts.push("SELECT " + attrs.join(",\n"));
        }

        // FROM
        const fromParts = Object.entries(query.from).map(([alias, source]) => {
            if (typeof source === "string") {
                return this.dialect.rename(this.dialect.quote(source), alias);
            }
            const subSql = this.buildQuery(source.query, bind);
            return `${source.lateral ? "LATERAL " : ""}(${subSql}) AS ${this.dialect.quote(alias)}`;
        });
        parts.push("FROM " + fromParts.join(", "));

        // WHERE
        if (query.where && query.where.length > 0) {
            const conditions = query.where
                .map(expr => this.resolveSerializedExpr(expr, bind))
                .filter(s => s.trim() !== "");
            if (conditions.length > 0) {
                parts.push("WHERE " + conditions.join(" AND "));
            }
        }

        // GROUP BY
        if (query.groupBy && query.groupBy.length > 0) {
            const groups = query.groupBy.map(expr => this.resolveSerializedExpr(expr, bind));
            parts.push("GROUP BY " + groups.join(", "));
        }

        // ORDER BY
        if (query.orderBy && query.orderBy.length > 0) {
            const orders = query.orderBy.map(o => {
                const expr = this.resolveSerializedExpr(o.exp, bind);
                return `${expr} ${o.desc ? "DESC" : "ASC"}`;
            });
            parts.push("ORDER BY " + orders.join(", "));
        }

        if (query.limit !== undefined) {
            parts.push(`LIMIT ${query.limit}`);
        }

        if (query.offset !== undefined) {
            parts.push(`OFFSET ${query.offset}`);
        }

        return parts.filter(p => p.trim() !== "").join(" ").trimEnd();
    }

    private resolveSerializedExpr(expr: SerializedExpression | string, bind: unknown[]): string {
        if (typeof expr === "string") {
            const t = expr.split(this.dialect.separator);
            return this.dialect.access(t[1] ?? t[0], t[1] ? t[0] : undefined);
        }
        if (expr.kind === "column") {
            const t = expr.name.split(this.dialect.separator);
            return this.dialect.access(t[1] ?? t[0], t[1] ? t[0] : undefined);
        }
        if (expr.kind === "value") {
            return this.dialect.bindParam(expr.value, bind);
        }
        // expr.kind === "call"
        const resolved = expr.params.map((p, i) => {
            if (this.dialect.isImmediateParam(expr.function, i)) {
                if (p.kind === "value") return String(p.value);
                throw new Error("Immediate parameter must be a literal value");
            }
            return this.resolveSerializedExpr(p, bind);
        });
        return this.dialect.function(expr.function, ...resolved);
    }

    buildSelect(
        req: FilterRequestNormalized<any, Functions>,
        tables: string | { [alias: string]: string; }
    ): { query: string; bind: unknown[]; } {
        const bind: unknown[] = [];
        const parts: string[] = [];

        const tableAlias = typeof tables === "string" ? { [tables]: tables } : tables;
        parts.push(this.select(req.attributes, bind));
        parts.push(this.from(tableAlias));

        if (req.where && req.where.length > 0) {
            const where = this.where(req.where, bind);
            if (where.trim() !== "") {
                parts.push(where);
            }
        }
        parts.push(this.groupBy(req.groupBy ?? [], bind));
        parts.push(this.orderBy(req.orderBy ?? [], bind));

        parts.push(this.limit(req.limit));
        parts.push(this.offset(req.offset));

        return { query: parts.join(" ").trimEnd(), bind };
    }

    private resolveAttr<F extends Expression<any, any, Functions>>(
        attr: F,
        bind: unknown[],
    ): string {
        if (typeof attr === "object" && "function" in attr && typeof attr.function === "string") {

            const resolved = [];
            if (Array.isArray(attr.params)) {
                if ("ignoreIfParamIsNull" in attr && attr.ignoreIfParamIsNull && attr.params.some(p => typeof p === "object" && "value" in p && (!p.value && p.value !== 0))) {
                    return "";
                }
                for (const p in attr.params) {
                    const param = attr.params[p];
                    if (this.dialect.isImmediateParam(attr.function, Number(p))) {
                        if (typeof param === "object" && "value" in param)
                            resolved.push(String(param.value));
                        else {
                            throw new Error("Immediate parameter must be a value");
                        }
                    } else {
                        resolved.push(this.resolveAttr(param as Expression<any, any, Functions>, bind));
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
        throw new Error("Invalid attribute: " + JSON.stringify(attr));
    }

    select<S extends SelectAttributes<any, Functions>>(
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

    where<T extends {}>(
        conditions: Condition<T, Functions>[] | undefined,
        bind: unknown[],
    ): string {
        if (!conditions || conditions.length === 0) {
            return "";
        }
        const conditionStrings = conditions.map(cond => this.resolveAttr(cond as Condition, bind))
            .filter(s => s.trim() !== "");
        if (conditionStrings.length === 0) {
            return "";
        }
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
        order: FilterRequest<any, Functions>["orderBy"],
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
        group: FilterRequest<any, Functions>["groupBy"],
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
