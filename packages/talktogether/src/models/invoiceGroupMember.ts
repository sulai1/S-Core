import { InferTableSchema, TableSchema } from "@s-core/client";

export const invoiceGroupMember = {
    name: "invoice_group_members",
    columns: {
        group_invoice_id: { type: Number, primary: true },
        member_invoice_id: { type: Number, primary: true },
    },
} satisfies TableSchema;

export type InvoiceGroupMember = InferTableSchema<typeof invoiceGroupMember>;
