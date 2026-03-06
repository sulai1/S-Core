


/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, expect, test } from "vitest";
import { FilterModule } from "../../src";

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
} as FilterModule<T>;


describe('cCheck type safety for Function Module with Parameters', () => {
    test('should enforce parameter type safety', async () => {
        const t: T[] = await m.find({
            orderBy: [["name", "asc"], [{ function: "toUpper", params: ["name"] }, "asc"]]
        })
        const t2: { name: string }[] = await m.find({
            attributes: ["name"],
            where: {
                name: "test",
                a: 5
            }
        });
        const t3: { name: string } | undefined = await m.findOne({
            attributes: ["name"],
            where: {
                name: "test",
                a: 5
            }
        });
        const t4: { name: string } | undefined = await m.findOne({
            attributes: {
                name: { function: "toUpper", params: ["name"] }
            },
            where: [{ function: "=", params: ["a", { value: 5 }] }]
        });
        expect(true).toBe(true);
    });
});