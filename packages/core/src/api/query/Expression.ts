import { FunctionsType } from "../../module/index.js";
import { fn } from "./Function.js";
import { col } from "./Column.js";
import { val } from "./Value.js";
import { Depth, ExprFactory, ParamsExprTuple, Expr, ReturnForArgs } from "./index.js";


export function createExprFactory<
    Ctx extends Record<string, unknown>,
    Defs extends FunctionsType,
    D extends Depth = 5
>(): ExprFactory<Ctx, Defs, D> {
    return {
        col: (name) => col<Ctx, typeof name>(name),
        val,
        fn: (name, ...params) => fn<Ctx, Defs, typeof name>(name, ...(params as ParamsExprTuple<Ctx, Defs, typeof name, 5>)) as unknown as Expr<Ctx, Defs, ReturnForArgs<Defs, typeof name, ParamsExprTuple<Ctx, Defs, typeof name, D>>, D>,
    };
}
