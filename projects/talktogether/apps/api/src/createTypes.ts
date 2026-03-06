import { createApiBuilder } from "s-core";
import { apiSchema } from "./schema";

export function buildApiType() {
    createApiBuilder().createTypesFromSchema("./src", apiSchema);
};

buildApiType();