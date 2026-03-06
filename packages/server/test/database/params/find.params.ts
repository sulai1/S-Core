import { EntitySchemaOptions } from "typeorm";
import { FilterRequest, InferTableSchema, SelectFunctionDefinitions } from "@s-core/core";


export const testRows = [
    { id: 1, name: "test", createdAt: "2024-01-21", sort: 22, type: "t" },
    { id: 2, name: "test2", createdAt: "2024-02-21", sort: 11, type: "t" },
    { id: 3, name: "a", createdAt: "2024-03-21", sort: 13, type: "b" }
]

export const TestModelSchema = {
    name: "TestModel",
    columns: {
        id: { type: Number, primary: true, generated: true },
        name: { type: String, nullable: false },
        createdAt: {
            type: String,
            nullable: false,
        },
        sort: { type: Number, nullable: false, precision: 0 },
        type: { type: String, length: 16, nullable: true },
    },
} as const satisfies EntitySchemaOptions<any>;

export const tests: {
    [key: string]: {
        options: FilterRequest<InferTableSchema<typeof TestModelSchema>, SelectFunctionDefinitions, any>;
        expected?: { index: number; field: string; value: any; f?: (val: any) => any; }[];
        rows: number;
    };
} = {
    "should group attributes with no aggregate automatically if one attribute is grouped": {
        options: {
            attributes: {
                x: { function: "max", params: ["createdAt"] },
                y: "type"
            },
            orderBy: [["type", "asc"]],
            groupBy: ["type"]
        },
        rows: 2,
        expected: [
            { index: 0, field: "y", value: "b" },
            { index: 0, field: "x", value: new Date("2024-03-21").getTime(), f: (val) => new Date(val).getTime() },
            { index: 1, field: "y", value: "t" },
            { index: 1, field: "x", value: new Date("2024-02-21").getTime(), f: (val) => new Date(val).getTime() },
        ]
    },
    "should retrieve max of date": {
        options: {
            attributes: {
                x: { function: "max", params: ["createdAt"] },
            }
        }, rows: 1, expected: [
            { index: 0, field: "x", value: "2024-03-21" }
        ]
    },
    "should find all with empty options": {
        rows: testRows.length, options: {}, expected: [
            { index: 0, field: "name", value: "test" },
            { index: 1, field: "name", value: "test2" }
        ]
    },
    "should find only included attributes": {
        options: { attributes: { A: "name" } }, rows: testRows.length, expected: [
            { index: 0, field: "A", value: "test" },
            { index: 1, field: "A", value: "test2" },
            { index: 1, field: "id", value: undefined }
        ]
    },
    "should find all with attributes with = filter": {
        options: {
            where: [{ function: "=", params: ["name", { value: "test" }] }]
        }, rows: 1, expected: [
            { index: 0, field: "name", value: "test" }
        ]
    },
    "should find all with attributes with like filter": {
        options: {
            where: [{ function: "like", params: ["name", { value: "test%" }] }]
        }, rows: 2, expected: [
            { index: 0, field: "name", value: "test" },
            { index: 1, field: "name", value: "test2" }
        ]
    },
    "should find all between": {
        options: {
            where: [{
                function: "and",
                params: [
                    { function: ">=", params: ["sort", { value: 10 }] },
                    { function: "<=", params: ["sort", { value: 20 }] }
                ]
            }],
            attributes: { a: "sort" },
            orderBy: [["sort", "asc"]]
        }, rows: 2, expected: [
            { index: 0, field: "a", value: 11 },
        ]
    },
    "should count the rows": {
        options: {
            attributes: {
                a: { function: "count", params: [] }
            },
        },
        rows: 1,
        expected: [
            { index: 0, field: "a", value: 3 }
        ]
    },
    "should function by type": {
        options: {
            attributes: {
                sum: { function: "sum", params: ["sort"] },
                type: "type"
            },
            groupBy: ["type"],
            orderBy: [["type", "desc"]]
        }, rows: 2, expected: [
            { index: 0, field: "sum", value: 33 },
            { index: 0, field: "type", value: "t" },
            { index: 1, field: "sum", value: 13 },
            { index: 1, field: "type", value: "b" },
        ]
    },
    "should multiply sort by 2": {
        options: {
            attributes: {
                x: { function: "*", params: ["sort", { value: 2 }] },
                type: "type"
            }
        }, rows: 3, expected: [
            { index: 0, field: "x", value: 2 * testRows[0].sort },
            { index: 1, field: "x", value: 2 * testRows[1].sort },
        ]
    },
    "should limit the results": {
        options: {
            limit: 1,
            orderBy: [["sort", "asc"]]
        }, rows: 1, expected: [
            { index: 0, field: "name", value: "test2" }
        ]
    },
    "should offset the results": {
        options: {
            offset: 1,
            limit: 2,
            orderBy: [["sort", "asc"]]
        }, rows: 2, expected: [
            { index: 1, field: "name", value: "test" },
            { index: 0, field: "name", value: "a" }
        ]
    },
    "should order the results": {
        options: {
            orderBy: [["sort", "desc"]]
        }, rows: 3, expected: [
            { index: 0, field: "sort", value: 22 },
            { index: 1, field: "sort", value: 13 },
            { index: 2, field: "sort", value: 11 }
        ]
    },
    "should work with function in where": {
        options: {
            where: [{
                function: "=", params: ["name", { function: "substring", params: ["name", { value: 1 }, { value: 1 }] }],
            }],
            orderBy: [["sort", "asc"]]
        }, rows: 1, expected: [
            { index: 0, field: "name", value: "a" },
        ]
    },
    "should retrieve substring": {
        options: {
            attributes: {
                x: { function: "substring", params: ["name", { value: 1 }, { value: 1 }] },
                type: "type"
            },
            orderBy: [["sort", "asc"]]
        }, rows: 3, expected: [
            { index: 0, field: "x", value: "t" },
            { index: 1, field: "x", value: "a" },
            { index: 2, field: "x", value: "t" },
        ]
    },
    "should work with nested functions": {
        options: {
            attributes: {
                x: {
                    function: "substring", params: [
                        { function: "toUpper", params: ["name"] },
                        { value: 1 },
                        { value: 1 }
                    ]
                },
                type: "type"
            },
            orderBy: [["sort", "asc"]]
        }, rows: 3, expected: [
            { index: 0, field: "x", value: "T" },
            { index: 1, field: "x", value: "A" },
            { index: 2, field: "x", value: "T" },
        ]
    },
    "should add two numbers": {
        options: {
            attributes: {
                x: { function: "+", params: ["sort", { value: 1 }] },
            },
            orderBy: [["sort", "asc"]]
        }, rows: 3, expected: [
            { index: 0, field: "x", value: 12 },
        ]
    },
    "should concat a number and a string": {
        options: {
            attributes: {
                x: { function: "concat", params: ["name", { function: "cast", params: ["sort", { value: "varchar" }] }] },
            },
            orderBy: [["sort", "asc"]]
        }, rows: 3, expected: [
            { index: 0, field: "x", value: "test211.0" },
        ]
    },
    "should work with nested function": {
        options: {
            attributes: {
                x: {
                    function: "*", params: [{
                        function: "cast",
                        params: ["id", { value: "varchar" }]
                    }, { value: 2 }]
                },
                y: "type"
            },
            orderBy: [["id", "asc"]]
        }, rows: 3, expected: [
            { index: 0, field: "x", value: 2 },
            { index: 0, field: "y", value: "t" },
            { index: 1, field: "x", value: 4 },
            { index: 1, field: "y", value: "t" },
        ]
    },
    "should negate conditions": {
        options: {
            attributes: {
                x: "id",
                y: "type"
            },
            where: [
                { function: "not", params: [{ function: "between", params: ["id", { value: 0 }, { value: 2 }] }] }
            ],
            orderBy: [["type", "asc"]]
        }, rows: 1, expected: [
            { index: 0, field: "x", value: 3 },
            { index: 0, field: "y", value: "b" },
        ]
    }
};
