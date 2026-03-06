
export type BasicObject<T = object> = {
    [P in keyof T]: T[P] extends string | number | boolean | Date | bigint ? T[P] : never;
};

export function isBasicObject(obj: unknown): obj is BasicObject {
    if (typeof obj !== "object" || obj === null) return false;
    return Object.values(obj).every(value => typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        value instanceof Date ||
        typeof value === "bigint"
    ) && Object.keys(obj).every(key => typeof key === "string"
    );
}

