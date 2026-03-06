import { BaseError } from "@s-core/core";

export class DatabaseError extends BaseError {
    constructor(message: string, private query?: string, bind?: {}, public cause?: Error,) {
        super(message, { cause: cause, context: { query: query, bind: bind } });
        this.name = "DatabaseError";
    }
    toString() {
        return `${this.name}: ${this.message} (${this.query} -> ${this.cause})`;
    }
}