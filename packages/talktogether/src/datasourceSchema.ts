import { createDatasourceSchema } from "@s-core/core";
import { identification, invoice, invoiceItem, item, salesman, transaction } from "./models/index.js";

export const datasourceSchema = createDatasourceSchema("test", {
    salesman,
    identification,
    item,
    transaction,
    invoice,
    invoiceItem,
});
