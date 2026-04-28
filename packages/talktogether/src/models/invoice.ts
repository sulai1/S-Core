import { InferTableSchema, TableSchema } from "@s-core/client";

export const invoice = {
    name: "invoices",
    columns: {
        id: { type: Number, primary: true, generated: true },
        period_start: { type: String, nullable: true },
        period_end: { type: String, nullable: true },
        description: { type: String, nullable: true },
        total: { type: Number, nullable: false },
        created_at: { type: String, generated: true },
        state: { type: Number, nullable: false },
    },
} satisfies TableSchema;

export type Invoice = InferTableSchema<typeof invoice>;