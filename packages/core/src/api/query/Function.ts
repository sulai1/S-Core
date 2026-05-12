import { FunctionsType } from "../../module/index.js";
import { CallExpr, ParamsExprTuple, ReturnForArgs } from "./index.js";


export function fn<
    Ctx extends Record<string, unknown>,
    Defs extends FunctionsType,
    Name extends keyof Defs & string
>(
    name: Name,
    ...params: ParamsExprTuple<Ctx, Defs, Name, 5>
): CallExpr<ReturnForArgs<Defs, Name, ParamsExprTuple<Ctx, Defs, Name, 5>>> {
    return {
        kind: "call",
        function: name,
        params,
    } as unknown as CallExpr<ReturnForArgs<Defs, Name, ParamsExprTuple<Ctx, Defs, Name, 5>>, Defs>;
}
