import { BaseError } from "../BaseError.js";

/**
 * Represents an error that occurs during an API request.
 */
export class ApiError extends BaseError {
    constructor(
        readonly url: string,
        options?: {
            method?: string;
            cause?: Error;
            expectedStatus?: number[];
            status?: number;
            statusText?: string;
            log?: boolean | ((msg: string) => void);
        }) {
        super(`Api request failed:  ${options?.method} : ${url} -> ${options?.statusText} (expected status ${options?.status} to be ${options?.expectedStatus ?? 200})`, {
            cause: options?.cause,
            context: { status: options?.status, statusText: options?.statusText, method: options?.method }
        });
    }
}
