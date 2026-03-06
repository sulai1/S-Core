/* eslint-disable jest/expect-expect */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, test, vi } from "vitest";
import { Repository, SelectFunctionDefinitions, TableSchema } from "../../src/index.js";

const T = {
    name: "test",
    columns: {
        a: {
            type: Number,
            primary: true,
            generated: true,
        },
        b: {
            primary: true,
            type: Number,
        },
        name: {
            type: String,
        },
        bool: {
            type: Boolean,
        }
    }
} satisfies TableSchema;

const m = {
    get: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    join: vi.fn(),
    getDefinitions: vi.fn(),
    findOne: vi.fn(),
} as Repository<typeof T, SelectFunctionDefinitions>;


describe('cCheck type safety for Function Module with Parameters', () => {
    test('should enforce parameter type safety', async () => {
        await m.find({
            attributes: {
                sum: {
                    function: "concat", // concat expects [String, String]
                    params: ["name", { value: "b" }] // 'a' and 'b' are numbers, not strings!
                },
                product: {
                    function: "*", // multiply expects [Number, Number] 
                    params: ["a", "b"] // 'a' and 'b' are numbers ✓
                },
                a: {
                    function: "substring",
                    params: [
                        "name",
                        { function: "+", params: ["a", { value: 2 }] },
                        { value: 2 }
                    ]
                }
            },
            where: [{ function: "=", params: [{ value: "asd" }, "name"] }],
            limit: 10,
            offset: 0,
            orderBy: [["name", "asc"], [{ function: "toUpper", params: ["name"] }, "asc"]]
        })
    });
    test("should create with CreationAttributes", async () => {
        const data = { name: "test", bool: true, b: 5 };
        await m.create(data);
        // @ts-expect-error - Missing required property 'bool'
        await m.create([{ name: "test" }]);
    });
    test('should update with valid parameters', async () => {
        await m.update(
            { name: "update", b: 10 },
        );
    });

    test('update with incompatible parameters should not compile', async () => {
        await m.update(
            {
                name: "update", b: 10,
                // @ts-expect-error - 'invalidProp' does not exist on type T
                invalidProp: "invalid"
            },
        );
    });
    test('update without primary key should not compile', async () => {
        await m.update(
            // @ts-expect-error - primary key 'b' is missing
            { name: "update" },
        );
    });
});