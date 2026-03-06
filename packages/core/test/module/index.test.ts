
import { describe, test } from 'vitest';
import { FilterModule, SelectFunctionDefinitions } from '../../src';

export type T = { a: string, b: number, c: number[], bool: boolean }

const f: FilterModule<T, SelectFunctionDefinitions> = {
    find() {
        return {} as any;
    },
    findOne() {
        return {} as any;
    }
};


describe('Generic definitions that should compile', () => {
    test('should compile', async () => {
        const r1: { a: number, b: string }[] = await f.find({
            attributes: {
                a: { function: "+", params: ["b", "b"] },
                b: "a"
            },
            where: [{ function: "like", params: ["a", "a"] }],
        });

        const r4: { A: string }[] = await f.find({
            where: [{ function: "=", params: ["bool", "bool"] }],
            attributes: { A: "a" },
        });
        const r5: { A: number | BigInt }[] = await f.find({
            where: [{ function: "like", params: ["a", "a"] }],
            attributes: {
                A: { function: "avg", params: ["b"] }
            }
        });
        const r7: { A: number | BigInt }[] = await f.find({
            where: [
                { function: "in", params: ["b", "c"] },
                { function: "in", params: ["a", { value: ["a", "b"] }] },
                { function: "like", params: ["a", "a"] },
                {
                    function: "or", params: [{ function: "like", params: ["a", "a"] }
                        , { function: "like", params: ["a", { value: "asd" }] }]
                }
            ]
            , attributes: {
                A: { function: "avg", params: ["b"] }
            }
        });
        const r8: { A: number | BigInt }[] = await f.find({
            where: [{
                function: "and", params: [{
                    function: "or", params: [
                        { function: "like", params: ["a", "a"] },
                        { function: "=", params: ["b", { value: 1 }] }
                    ]
                }, {
                    function: "or", params: [
                        { function: "like", params: ["a", "a"] },
                        { function: "like", params: ["a", { value: "asd" }] }
                    ]
                }]
            },]
            , attributes: {
                A: { function: "avg", params: ["b"] }
            }
        });
        const r9: { A: number, B: string }[] = await f.find({
            attributes: {
                A: {
                    function: "*",
                    params: [
                        {
                            function: "cast", params: ['a', { value: "number" }

                            ]
                        }, "b"]
                },
                B: { function: "cast", params: ["b", { value: "string" }] }
            },
            where: [
                { function: "like", params: ["a", "a"] },
                { function: "~", params: ["a", { value: "asd" }] },
                {
                    function: "not", params: [{ function: "=", params: ["a", { value: "1" }] }]
                }
            ],
        });
        const r10: { A: number }[] = await f.find({
            attributes: {
                A: { function: "*", params: [{ function: "max", params: ["b"] }, { function: "min", params: ["b"] }] },
            },
            where: [
                { function: "not", params: [{ function: "between", params: ["b", { value: 1 }, { value: 2 }] }] },
            ],
        });

    });
});
