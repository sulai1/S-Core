import { DataSourceSchema } from "@s-core/client";

export type SQLDialect = {

    readonly type: "postgres" | "sqlite";

    rename(expr: string, newName: string): string;

    /**
     * create a function expression
     */
    function(name: string, ...args: string[]): string;

    separator: string;

    /**
     * bind a parameter to the query, storuing the value in the bind object
     * @param value the value to bind
     * @param bind the bind object which stores the bound values
     * @param type optional type of the value
     * @return the expression with the placeholder for the bound value
     */
    bindParam(value: unknown, bind: unknown[], type?: string): string;

    /**
     * quote an identifier (table name, attribute name, etc)
     * @param identifier 
     */
    quote(identifier: string): string;

    /**
     * access an attribute, optionally specifying the table to wich it belongs
     * @param attribute 
     * @param table 
     */
    access(attribute: string, table?: string, tableAlias?: { [alias: string]: string; }): string;

    table(name: string): string;

    supportedFeatures(schema: DataSourceSchema): DataSourceSchema;
}
