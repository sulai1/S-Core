import { describe, expect, test } from "vitest";
import { QuerySerializer, SelectFunctionDefinitions, TableSchema } from "../../src/index.js";

type Salesmans = TableSchema<{
    id: number;
    last: string;
}>;

type Identifications = TableSchema<{
    id: number;
    id_nr: string;
    validTo: string;
    salesman: number;
}>;


describe("QuerySerializer lateralFrom", () => {
    test("builds a correlated lateral nested source", () => {
        const serializer = new QuerySerializer<{
            Salesmans: Salesmans;
            Identifications: Identifications;
        }, SelectFunctionDefinitions>({} as {
            Salesmans: Salesmans;
            Identifications: Identifications;
        });

        const query = serializer.from({
            s: "Salesmans",
        }).lateralFrom("i", { ident: "Identifications" }, (from) =>
            from
                .select({
                    id_nr: "ident.id_nr",
                    validTo: "ident.validTo",
                })
                .where(e => e.fn("=", e.col("ident.salesman"), e.col("s.id")))
                .orderBy("ident.validTo", true)
                .orderBy("ident.id", true)
                .limit(1)
                .offset(0)
        ).select({
            id: "s.id",
            idNr: "i.id_nr",
            validTo: "i.validTo",
        }).where(e => e.fn("=", e.col("s.last"), e.val("TINCA")))
            .build();

        expect(query.from.i).toMatchObject({
            lateral: true,
        });

        if (typeof query.from.i === "string") {
            throw new Error("expected nested source");
        }

        expect(query.from.i.query.where).toEqual([
            {
                kind: "call",
                function: "=",
                params: [
                    { kind: "column", name: "ident.salesman" },
                    { kind: "column", name: "s.id" },
                ],
            },
        ]);
        expect(query.from.i.query.limit).toBe(1);
        expect(query.from.i.query.offset).toBe(0);
    });
});
