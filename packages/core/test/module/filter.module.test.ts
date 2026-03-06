
/* eslint-disable jest/expect-expect */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, expect, test, vi } from "vitest";
import { extendFilterModule } from "../../src/index.js";

type T = { a: number; b: number; name: string; bool: boolean };
const find = vi.fn();
const findOne = vi.fn();
const filterModule = extendFilterModule<T>({
    find,
    findOne
})


describe('cCheck type safety for Function Module with Parameters', () => {
    test('findOne extension should only retrieve the first row with selected attributes', async () => {
        find.mockResolvedValue([{ a: 1, b: 2 }]);
        const res = await filterModule.findOne({
            attributes: ["a", "b"]
        })
        expect(find).toHaveBeenCalledWith({
            attributes: { "a": "a", "b": "b" },
            where: undefined,
            orderBy: undefined,
            limit: 1,
            offset: undefined
        });
        expect(res).toBeDefined();
        expect(res?.a).toBeDefined();
        expect(res?.b).toBeDefined();
        // @ts-expect-error -- name is not selected
        expect(res?.name).toBeUndefined();
        // @ts-expect-error -- bool is not selected
        expect(res?.bool).toBeUndefined();
    });
    test('find extension should retrieve multiple rows with selected attributes', async () => {
        find.mockResolvedValue([{ a: 1, b: 2 }, { a: 3, b: 4 }]);
        const res = await filterModule.find({
            attributes: { "a": "a", "b": "b" },
            where: {
                a: 3
            }
        })
        expect(find).toHaveBeenCalledWith({
            attributes: { "a": "a", "b": "b" },
            where: [{ function: "=", params: ["a", { value: 3 }] }],
            orderBy: undefined,
            limit: undefined,
            offset: undefined
        });
        expect(res).toBeDefined();
        expect(res.length).toBe(2);
        expect(res[0].a).toBeDefined();
        expect(res[0].b).toBeDefined();
        expect(res[1].a).toBeDefined();
        expect(res[1].b).toBeDefined();
        // @ts-expect-error -- name is not selected
        expect(res[0].name).toBeUndefined();
        // @ts-expect-error -- bool is not selected
        expect(res[0].bool).toBeUndefined();

    });
    test('find extension should retrieve all rows with all fields if no attributes are specified', async () => {
        find.mockResolvedValue([{ a: 1, b: 2, name: "test", bool: true }, { a: 3, b: 4, name: "test2", bool: false }]);
        const res = await filterModule.find({})
        expect(find).toHaveBeenCalledWith({
            attributes: undefined,
            where: undefined,
            orderBy: undefined,
            limit: undefined,
            offset: undefined
        });
        expect(res).toBeDefined();
        expect(res.length).toBe(2);
        expect(res[0].a).toBeDefined();
        expect(res[0].b).toBeDefined();
        expect(res[1].a).toBeDefined();
        expect(res[1].b).toBeDefined();
        expect(res[0].name).toBeDefined();
        expect(res[0].bool).toBeDefined();
        expect(res[1].name).toBeDefined();
        expect(res[1].bool).toBeDefined();

    });
});