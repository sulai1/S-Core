


/* eslint-disable jest/expect-expect */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, test } from "vitest";
import { FilterModule, SelectFunctionDefinitions } from "../../src/index.js";

type T = { a: number; b: number; name: string; bool: boolean };

const m = {
    find: (...param: any) => {
        // Mock implementation for testing
        return undefined as any;
    },
    findOne: (...param: any) => {
        // Mock implementation for testing
        return undefined as any;
    },
    join: (...param: any) => {
        // Mock implementation for testing
        return undefined as any;
    },
    getDefinitions: () => { return {} as any }
} as FilterModule<T, SelectFunctionDefinitions>;

describe('cCheck type safety for Function Module with Parameters', () => {
    test('MathFunctions', async () => {
        const res: { sum: string, product: number, a: string }[] = await m.find({
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
                        "a",
                        {
                            function: "*",
                            params: ["a", "a"]
                        }
                    ]
                }
            },
            where: [
                {
                    function: "=",
                    params: [
                        "a",
                        { function: "+", params: ["a", "b"] }
                    ]
                }
            ],
            limit: 10,
            offset: 0,
            orderBy: [["name", "asc"], [{ function: "toUpper", params: ["name"] }, "asc"]]
        })

    });
});