import { Condition, FunctionCall, SelectAttributes, SelectFunctionDefinitions } from "@s-core/core";
import { describe, expect, test } from "vitest";
import { SqliteDialect, SQLQueryBuilder } from "../../../src/index.js";

const dialect = new SqliteDialect()
const builder = new SQLQueryBuilder<SelectFunctionDefinitions>(dialect);

describe("AbstractQueryBuilder", () => {


    test.for<{
        name: string,
        attributes: SelectAttributes<any, SelectFunctionDefinitions>,
        expected: string,
        bind?: unknown[],
        aggregates?: (string | FunctionCall)[]
    }>([{
        name: "no attributes",
        attributes: {},
        expected: "SELECT * "
    }, {
        name: "simple table column",
        attributes: {
            a: "table1.column1",
        },
        expected: `SELECT "table1"."column1" AS "a"`,
        bind: [],
    }, {
        name: "multiple columns with function",
        attributes: {
            c: { function: "sum", params: ["table1.column2"] }
        },
        expected: 'SELECT sum("table1"."column2") AS "c"',
    }, {
        name: "bind parameter",
        attributes: {
            b: { function: "+", params: [{ value: 42 }, "table1.column1"] },
        },
        expected: 'SELECT ($1 + "table1"."column1") AS "b"',
    }] as const)("attributes $name", ({ attributes, expected, aggregates, bind }) => {
        const actualBind = [] as unknown[];
        const result = builder.select(attributes, actualBind);
        expect(result).toEqual(expected);
        if (bind)
            expect(actualBind).toEqual(bind);
    });


    test.for<{
        name: string,
        conditions: Condition<any, SelectFunctionDefinitions>[],
        expected: string,
        bind?: unknown[],
        aggregates?: (string | FunctionCall)[]
    }>([{
        name: "no conditions", conditions: [], expected: ""
    }, {
        name: "single condition",
        conditions: [
            { function: "=", params: ["table1.column1", { value: "test" }] }
        ],
        expected: 'WHERE ("table1"."column1" = $1)',
    }])("where $name", ({ conditions, expected, aggregates, bind }) => {
        const actualBind = [] as unknown[];
        const result = builder.where(conditions, actualBind);
        expect(result).toEqual(expected);
        if (bind)
            expect(actualBind).toEqual(bind);
    });


    test.for<{ name: string, tables: { [alias: string]: string }, expected: string }>([{
        name: "single table",
        tables: { t1: "table1" },
        expected: 'FROM "table1" AS "t1"',
    }, {
        name: "multiple tables",
        tables: { t1: "table1", t2: "table2" },
        expected: 'FROM "table1" AS "t1", "table2" AS "t2"',
    }])("from $name", ({ tables, expected }) => {
        const result = builder.from(tables);
        expect(result).toEqual(expected);
    });


    test.for<{
        name: string,
        order: [string | FunctionCall<any, any, SelectFunctionDefinitions>, direction: "asc" | "desc"][],
        expected: string,
        bind?: unknown[],
        aggregates?: (string | FunctionCall<any, any, SelectFunctionDefinitions>)[]
    }>([{
        name: "no order",
        order: [],
        expected: "",
    }, {
        name: "single order by column",
        order: [["table1.column1", "asc"]],
        expected: 'ORDER BY "table1"."column1" asc',
    }, {
        name: "multiple order by with function",
        order: [
            [{ function: "sum", params: ["table1.column2"] }, "desc"],
            ["table2.a", "asc"]
        ],
        expected: 'ORDER BY sum("table1"."column2") desc, "table2"."a" asc',
        aggregates: ['sum("table1"."column2")'],
    }, {
        name: "function with spaced arguments does not add extra comma",
        order: [[{ function: "cast", params: ["table1.column1", { value: "TEXT" }] }, "asc"]],
        expected: 'ORDER BY CAST("table1"."column1" AS TEXT) asc',
    }])("orderBy $name", ({ order, expected, aggregates, bind }) => {
        const actualBind = [] as unknown[];
        const result = builder.orderBy(order, actualBind);
        expect(result).toEqual(expected);
        if (bind)
            expect(actualBind).toEqual(bind);
    });


    test.for<{
        name: string,
        group: (string | FunctionCall<any, any, SelectFunctionDefinitions>)[],
        expected: string,
        bind?: unknown[],
        aggregates?: (string | FunctionCall<any, any, SelectFunctionDefinitions>)[]
    }>([{
        group: [],
        name: "no group by",
        expected: "",
    }, {
        name: "single group by column",
        group: ["table1.column1"],
        expected: 'GROUP BY "table1"."column1"',
    }, {
        name: "multiple group by with function",
        group: [
            { function: "+", params: ["table2.b", { value: 1 }] },
            "table1.column1"
        ],
        expected: 'GROUP BY ("table2"."b" + $1), "table1"."column1"',
        bind: [1],
    }])("groupBy $name", ({ group, expected, aggregates, bind }) => {
        const actualBind = [] as unknown[];
        const result = builder.groupBy(group, actualBind);
        expect(result).toEqual(expected);
        if (bind)
            expect(actualBind).toEqual(bind);
    });
});

