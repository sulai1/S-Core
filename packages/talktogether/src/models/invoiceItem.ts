import { InferTableSchema, TableSchema } from "@s-core/client";

export const invoiceItem = {
    name: "invoice_items",
    columns: {
        invoice_id: { type: Number, primary: true },
        transaction_id: { type: Number, primary: true },
    },
} satisfies TableSchema;

export type InvoiceItem = InferTableSchema<typeof invoiceItem>;