import { InferTableSchema, TableSchema } from "@s-core/client";

export const salesman = {
    name: "Salesmans",
    columns: {
        id: { type: Number, primary: true, generated: true },
        first: { type: String, nullable: false },
        last: { type: String, nullable: false },
        phone: { type: String, nullable: true },
        image: { type: String, nullable: true },
        message: { type: String, nullable: true },
        createdAt: { type: String, generated: true },
        updatedAt: { type: String, generated: true },
        locked: { type: Boolean, nullable: true },
    }
} satisfies TableSchema

export type Salesman = InferTableSchema<typeof salesman>;
