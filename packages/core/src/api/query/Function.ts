import { FunctionsType } from "../../module/index.js";
import { ParamsExprTuple, Expr, ReturnForArgs } from "./index.js";


export function fn<
    Ctx extends Record<string, unknown>,
    Defs extends FunctionsType,
    Name extends keyof Defs & string
>(
    name: Name,
    ...params: ParamsExprTuple<Ctx, Defs, Name, 5>
): Expr<Ctx, Defs, ReturnForArgs<Defs, Name, ParamsExprTuple<Ctx, Defs, Name, 5>>, 5> {
    return {
        kind: "call",
        function: name,
        params,
    } as unknown as Expr<Ctx, Defs, ReturnForArgs<Defs, Name, ParamsExprTuple<Ctx, Defs, Name, 5>>, 5>;
}
