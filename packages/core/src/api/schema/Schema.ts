import { ParseError } from "./ParseError.js";
import { SafeResult } from "./index.js";

/**
 * Schema interface for data validation and parsing.
 * @template T - The type of data the schema validates and parses.
 */
export type Schema<T = unknown> = {
    readonly description?: string;

    /**
     * parses the input data and returns the validated data of type T. May throw an error if validation fails. 
     * @param data 
     * @returns T 
     */
    parse: (data: unknown) => T;
    /**
     * async version of parse that returns a Promise of T. May throw an error if validation fails.
     * @param data 
     * @returns Promise<T>
     */
    parseAsync: (data: unknown) => Promise<T>;
    /**
     * Safely parses the input data and returns a SafeResult containing either the validated data of type T or an error.
     * @param data 
     * @returns SafeResult<T>
     */
    safeParse: (data: unknown) => SafeResult<T>;
    /**
     * Safely parses the input data asynchronously and returns a Promise of a SafeResult containing either the validated data of type T or an error.
     * @param data 
     * @returns Promise<SafeResult<T>>
     */
    safeParseAsync: (data: unknown) => Promise<SafeResult<T>>;

    /**
     * Returns a new Schema that allows the type T or undefined.
     * @returns Schema<T | undefined>
     */
    optional(): Schema<T | undefined>;

    /**
     * Returns a new Schema that allows an array of type T.
     * @returns Schema<T[]>
     */
    array(): Schema<T[]>;
};

/**
 * Type guard to check if an object is a Schema.
 * @param obj the object to check
 * @returns a boolean indicating if the object is a Schema
 */
export function isSchema<T>(obj: any): obj is Schema<T> {
    return (
        obj !== null
        && typeof obj === 'object'
        && 'parse' in obj
        && typeof (obj as Record<string, unknown>).parse === 'function'
        && 'parseAsync' in obj
        && typeof (obj as Record<string, unknown>).parseAsync === 'function'
        && 'safeParse' in obj
        && typeof (obj as Record<string, unknown>).safeParse === 'function'
        && 'safeParseAsync' in obj
        && typeof (obj as Record<string, unknown>).safeParseAsync === 'function'
    );
}

/**
 * extends a parse function to a Schema.
 * @param parse - the parse function should take unknown data and return type T
 * @returns a Schema of type T
 */
export function extendSchema<T>(parse: (data: unknown) => T): Schema<T> {
    return {
        parse,
        parseAsync: async (data: unknown) => parse(data),
        safeParse: (data: unknown): SafeResult<T> => {
            try {
                const parsed = parse(data);
                return { success: true, data: parsed };
            } catch (e) {
                return { success: false, error: e as Error };
            }
        },
        safeParseAsync: async (data: unknown): Promise<SafeResult<T>> => {
            try {
                const parsed = await parse(data);
                return { success: true, data: parsed };
            }
            catch (e) {
                if (e instanceof Error)
                    return { success: false, error: new ParseError("Async parse error: " + e.message, { cause: e, object: data }) };
                else
                    return { success: false, error: new ParseError("Unknown error: " + JSON.stringify(e), { object: data, context: {} }) };
            }
        },
        optional(): Schema<T | undefined> {
            return extendSchema((data: unknown) => {
                return data ? parse(data) : undefined;
            });
        },
        array(): Schema<T[]> {
            return extendSchema((data: unknown): T[] => {
                if (!Array.isArray(data)) {
                    throw new ParseError("Invalid data for array schema: not an array");
                }
                return data.map(item => parse(item));
            });
        },
    }
}
