import { describe, expect, test } from "vitest";
import { QuerySerializer, TableSchema } from "../../src/index.js";

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

type MinimalDefs = {
    "=": readonly [unknown, unknown, boolean];
};

describe("QuerySerializer lateralFrom", () => {
    test("builds a correlated lateral nested source", () => {
        const serializer = new QuerySerializer<{
            Salesmans: Salesmans;
            Identifications: Identifications;
        }, MinimalDefs>({} as {
            Salesmans: Salesmans;
            Identifications: Identifications;
        });

        const query = serializer.from({
            s: "Salesmans",
        })
            .lateralFrom("i", { ident: "Identifications" }, (from) =>
                from
                    .select({
                        id_nr: "ident.id_nr",
                        validTo: "ident.validTo",
                    })
                    .where({
                        kind: "call",
                        function: "=",
                        params: [
                            { kind: "column", name: "ident.salesman" },
                            { kind: "column", name: "s.id" },
                        ],
                    })
                    .orderBy("ident.validTo", true)
                    .orderBy("ident.id", true)
            )
            .select({
                id: "s.id",
                idNr: "i.id_nr",
                validTo: "i.validTo",
            })
            .where({
                kind: "call",
                function: "=",
                params: [
                    { kind: "column", name: "s.last" },
                    { kind: "value", value: "TINCA" },
                ],
            })
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
    });
});
