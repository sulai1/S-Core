import { InferTableSchema, TableSchema } from "@s-core/client";

export const transaction = {
    name: "Transactions",
    columns: {
        id: { type: String, primary: true, generated: true },
        item: { type: Number, nullable: false },
        date: { type: String, generated: true },
        salesman: { type: Number, nullable: false },
        quantity: { type: Number, nullable: false },
        price: { type: Number, nullable: false },
        total: { type: Number, nullable: false },
    },
} satisfies TableSchema

export type Transaction = InferTableSchema<typeof transaction>;
