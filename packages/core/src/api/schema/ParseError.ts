import { BaseError } from "../../BaseError.js";
import { Schema } from "./Schema.js";

/**
 * Custom error class for schema parsing errors.
 * Extends the BaseError class to provide additional context for parsing errors.
 * @template T - The type of data being parsed.
 */

export class ParseError<T> extends BaseError {
    constructor(message: string, context?: { context?: object; cause?: Error; object?: unknown; schema?: Schema; key?: string; log?: (message: string) => void; }) {
        super(message, {
            cause: context?.cause,
            context: {
                object: JSON.stringify(context?.object),
                schema: JSON.stringify(context?.schema),
                key: context?.key,
                ...context?.context
            }
        });
        this.name = "ParseError";
    }
}
