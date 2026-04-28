import type { DataSourceSchema, TableInstanceTypes } from '@s-core/core';
import { identification } from './identification.js';
import { invoice } from './invoice.js';
import { invoiceGroupMember } from './invoiceGroupMember.js';
import { invoiceItem } from './invoiceItem.js';
import { item } from './item.js';
import { salesman } from './salesman.js';
import { transaction } from './transaction.js';
import { user } from './user.js';

export * from './identification.js';
export * from './invoice.js';
export * from './invoiceGroupMember.js';
export * from './invoiceItem.js';
export * from './item.js';
export * from './salesman.js';
export * from './transaction.js';
export * from './user.js';

export const tables = {
    Identification: identification,
    Salesman: salesman,
    Item: item,
    Transaction: transaction,
    Invoice: invoice,
    InvoiceGroupMember: invoiceGroupMember,
    InvoiceItem: invoiceItem,
    User: user,
} satisfies DataSourceSchema;

export type Tables = TableInstanceTypes<typeof tables>;