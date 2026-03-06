import { OpenAPIV3_1 } from "openapi-types";
import { OpenAPIV3 } from "./schema/index.js";

/**
 * responsible for generating TypeScript types from a schema.
 * It should handle both local file paths and remote URLs, and copy all referenced
 * files to the specified output directory.
 */
export type ApiBuilder = {
    /**
     * Downloads all the schema files and builds the API client from the OpenAPI schema
     * @param schemaUrl local file or url
     * @param apiDir output directory
     */
    build(
        schemaUrl: string,
        apiDir: string
    ): Promise<void>;
    /**
     * builds types file from the OpenAPI schema
     * @param apiDir output directory
     * @param schemaUrl local file or url
     */
    createTypesFromSchema(
        apiDir: string,
        schemaUrl: string | OpenAPIV3.Document | OpenAPIV3_1.Document
    ): Promise<void>;


};