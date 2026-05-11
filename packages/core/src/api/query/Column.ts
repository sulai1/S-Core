import { ColumnExpr } from "./index.js";


export function col<
    Ctx extends Record<string, unknown>,
    K extends keyof Ctx & string
>(name: K): ColumnExpr<Ctx, Ctx[K]> {
    return { kind: "column", name } as unknown as ColumnExpr<Ctx, Ctx[K]>;
}
