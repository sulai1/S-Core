import { InferTableSchema, TableSchema } from "@s-core/client";

export const identification = {
    name: "Identifications",
    columns: {
        id: { type: Number, primary: true, generated: true },
        id_nr: { type: Number },
        salesman: { type: Number, nullable: false },
        createdAt: { type: String },
        updatedAt: { type: String },
        validTo: { type: String },
    },
} satisfies TableSchema

export type Identification = InferTableSchema<typeof identification>;
