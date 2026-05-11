import { ValueExpr } from "./index.js";


export function val<V>(value: V): ValueExpr<V> {
    return { kind: "value", value };
}
