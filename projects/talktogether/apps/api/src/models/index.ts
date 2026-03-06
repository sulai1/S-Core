import type { DataSourceSchema, TableInstanceTypes } from 's-core-client';
import { identification } from './identification';
import { item } from './item';
import { salesman } from './salesman';
import { transaction } from './transaction';
import { user } from './user';

export * from './identification';
export * from './item';
export * from './salesman';
export * from './transaction';
export * from './user';

export const tables = {
    Identification: identification,
    Salesman: salesman,
    Item: item,
    Transaction: transaction,
    User: user,
} satisfies DataSourceSchema;

export type Tables = TableInstanceTypes<typeof tables>;