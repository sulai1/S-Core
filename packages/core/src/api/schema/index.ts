import { extendSchema, Schema } from "./Schema";

export * from "./BasicObject";
export * from "./file";
export * from "./datsource";
export * from "./Schema";

export type SafeResult<T, E extends Error = Error> = {
    success: false;
    error: E;
} | {
    success: true;
    data: T;
}

export function isSchema<T>(obj: unknown): obj is Schema<T> {

    return obj !== null
        && typeof obj === 'object'
        && 'parse' in obj
        && 'parseAsync' in obj
        && 'safeParse' in obj
        && 'safeParseAsync' in obj
        && typeof obj.parse === 'function'
        && typeof obj.parseAsync === 'function'
        && typeof obj.safeParse === 'function'
        && typeof obj.safeParseAsync === 'function';
}



export function arraySchema<T>(itemSchema: Schema<T>): Schema<T[]> {

    function parse(data: unknown): T[] {
        if (!Array.isArray(data)) {
            throw new Error(`Expected array but received: ${typeof data}`);
        }
        return data.map(item => itemSchema.parse(item));
    }
    return extendSchema(parse);
}

export function objectSchema<T extends object>(attributes: { [P in keyof T]: Schema<T[P]> }): Schema<T> {
    function parse(value: unknown): T {
        if (typeof value !== 'object' || value === null) {
            throw new Error(`Expected object but received: ${typeof value}`);
        }
        const result = {} as T;
        for (const key in attributes) {
            const attr = attributes[key];
            result[key] = attr.parse((value as Record<string, unknown>)[key]);
        }
        return result;
    }
    return extendSchema(parse);
}
