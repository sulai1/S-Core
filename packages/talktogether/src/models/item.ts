import { InferTableSchema, TableSchema } from "@s-core/client";

export const item = {
    name: "Items",
    columns: {
        id: { type: Number, primary: true, generated: true },
        edition: { type: Number },
        name: { type: String },
        description: { type: String },
        cost: { type: Number },
        price: { type: Number },
        quantity: { type: Number },
        createdAt: { type: String, generated: true },
        updatedAt: { type: String, generated: true },
        validTo: { type: String, generated: true },
    },
} satisfies TableSchema

export type Item = InferTableSchema<typeof item>;