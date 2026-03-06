import type { TableSchema, InferTableSchema } from '@s-core/client';

export const user = {
    name: 'users',
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: true,
        },
        email: {
            type: String,
        },
        password: {
            type: String,
        },
        firstName: {
            type: String,
            nullable: true,
        },
        lastName: {
            type: String,
            nullable: true,
        },
        createdAt: {
            type: String,
            generated: true
        },
        updatedAt: {
            type: String,
            generated: true
        },
    },
} satisfies TableSchema;

export type User = InferTableSchema<typeof user>;
