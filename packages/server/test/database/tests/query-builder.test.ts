import { Condition, FunctionCall, SelectAttributes, SelectFunctionDefinitions, SerializedQuery } from "@s-core/core";
import { describe, expect, test } from "vitest";
import { SqliteDialect, SQLQueryBuilder } from "../../../src/index.js";

const dialect = new SqliteDialect()
const builder = new SQLQueryBuilder<SelectFunctionDefinitions>(dialect);

describe("AbstractQueryBuilder", () => {

    test("build serialized query", () => {
        const query: SerializedQuery = {
            from: { t1: "table1" },
            select: {
                id: { kind: "column", name: "t1.id" },
                total: { kind: "call", function: "+", params: [{ kind: "column", name: "t1.value" }, { kind: "value", value: 2 }] },
            },
            where: [
                { kind: "call", function: "=", params: [{ kind: "column", name: "t1.active" }, { kind: "value", value: true }] },
            ],
            groupBy: [{ kind: "column", name: "t1.id" }],
            orderBy: [{ exp: { kind: "column", name: "t1.id" }, desc: true }],
        };

        const result = builder.build(query);

        expect(result.query).toEqual(
            'SELECT "t1"."id" AS "id",\n("t1"."value" + $1) AS "total" FROM "table1" AS "t1" WHERE ("t1"."active" = $2) GROUP BY "t1"."id" ORDER BY "t1"."id" DESC'
        );
        expect(result.bind).toEqual([2, true]);
    });

    test("build serialized query with nested source", () => {
        const query: SerializedQuery = {
            from: {
                t1: "table1",
                sub: {
                    query: {
                        from: { t2: "table2" },
                        select: {
                            id: { kind: "column", name: "t2.id" },
                        },
                        where: [
                            { kind: "call", function: "=", params: [{ kind: "column", name: "t2.kind" }, { kind: "value", value: "A" }] },
                        ],
                    },
                    lateral: true,
                },
            },
            select: {
                id: { kind: "column", name: "t1.id" },
                subId: { kind: "column", name: "sub.id" },
            },
            where: [
                { kind: "call", function: "=", params: [{ kind: "column", name: "t1.state" }, { kind: "value", value: 1 }] },
            ],
        };

        const result = builder.build(query);

        expect(result.query).toEqual(
            'SELECT "t1"."id" AS "id",\n"sub"."id" AS "subId" FROM "table1" AS "t1", LATERAL (SELECT "t2"."id" AS "id" FROM "table2" AS "t2" WHERE ("t2"."kind" = $1)) AS "sub" WHERE ("t1"."state" = $2)'
        );
        expect(result.bind).toEqual(["A", 1]);
    });

    test("build serialized query with correlated lateral source", () => {
        const query: SerializedQuery = {
            from: {
                s: "Salesmans",
                i: {
                    query: {
                        from: { ident: "Identifications" },
                        select: {
                            id_nr: { kind: "column", name: "ident.id_nr" },
                            validTo: { kind: "column", name: "ident.validTo" },
                        },
                        where: [
                            {
                                kind: "call",
                                function: "=",
                                params: [
                                    { kind: "column", name: "ident.salesman" },
                                    { kind: "column", name: "s.id" },
                                ],
                            },
                        ],
                        orderBy: [
                            { exp: { kind: "column", name: "ident.validTo" }, desc: true },
                            { exp: { kind: "column", name: "ident.id" }, desc: true },
                        ],
                    },
                    lateral: true,
                },
            },
            select: {
                id: { kind: "column", name: "s.id" },
                idNr: { kind: "column", name: "i.id_nr" },
                validTo: { kind: "column", name: "i.validTo" },
            },
            where: [
                { kind: "call", function: "like", params: [{ kind: "column", name: "s.last" }, { kind: "value", value: "TINCA" }] },
            ],
        };

        const result = builder.build(query);

        expect(result.query).toEqual(
            'SELECT "s"."id" AS "id",\n"i"."id_nr" AS "idNr",\n"i"."validTo" AS "validTo" FROM "Salesmans" AS "s", LATERAL (SELECT "ident"."id_nr" AS "id_nr",\n"ident"."validTo" AS "validTo" FROM "Identifications" AS "ident" WHERE ("ident"."salesman" = "s"."id") ORDER BY "ident"."validTo" DESC, "ident"."id" DESC) AS "i" WHERE ("s"."last" like $1)'
        );
        expect(result.bind).toEqual(["TINCA"]);
    });

    test("ignore udefined parameters in select", () => {
        const result = builder.buildSelect({
            attributes: { a: "table1.column1" },
            where: [
                { function: "<", ignoreIfParamIsNull: true, params: [{ value: null as unknown as string }, "table1.column1"] },
                { function: "<", ignoreIfParamIsNull: true, params: [{ value: 0 }, "table2.column1"] }
            ]
        },
            "table1");
        expect(result.query).toEqual(`SELECT "table1"."column1" AS "a" FROM "table1" AS "table1" WHERE ($1 < "table2"."column1")`);
    });

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
        conditions: Condition<Record<string, any>, SelectFunctionDefinitions>[],
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
        const result = builder.where(conditions as Condition[], actualBind);
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

