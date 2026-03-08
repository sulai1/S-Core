import { createDatasourceSchema } from "@s-core/core";
import { identification, item, salesman, transaction } from "./models";

export const datasourceSchema = createDatasourceSchema("test", {
    salesman,
    identification,
    item,
    transaction
});
