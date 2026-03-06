import { AnyCallable, ConstructorOrCallable } from "../../../generic";

export type TableSchema<T extends object = Record<string, unknown>> = {
    name: string;
    description?: string;
    columns: {
        [P in keyof T]: {
            type: ConstructorOrCallable<T[P]>;
            primary?: boolean;
            generated?: 
            boolean | "createdAt" | "updatedAt" | "uuid" | "increment";
            nullable?: boolean;
            default?: boolean;
            description?: string;
        };
    };
};

export type InferTableSchema<T extends TableSchema<any>> = {
    [K in keyof T["columns"]as T["columns"][K] extends { nullable?: true } ? K : never]?:
    T["columns"][K] extends { type: infer Type }
    ? Type extends AnyCallable<infer U>
    ? U
    : never
    : never;
} & {
    [K in keyof T["columns"]as T["columns"][K] extends { nullable?: true } ? never : K]:
    T["columns"][K] extends { type: infer Type }
    ? Type extends AnyCallable<infer U>
    ? U
    : never
    : never;
};


export type InferPrimaryKey<T extends TableSchema<any>> = {
    [K in keyof T["columns"]as T["columns"][K] extends {
        type: infer Type;
        primary: infer Primary;
        generated?: infer Generated;
    } ? Primary extends true ? Generated extends true ? never : K : never : never]:
    T["columns"][K] extends { type: infer Type }
    ? Type extends AnyCallable<infer U>
    ? U
    : never
    : never;
} & {
    [K in keyof T["columns"]as T["columns"][K] extends {
        type: infer Type;
        primary: infer Primary;
        generated?: infer Generated;
    } ? Primary extends true ? Generated extends true ? K : never : never : never]?:
    T["columns"][K] extends { type: infer Type }
    ? Type extends AnyCallable<infer U>
    ? U
    : never
    : never;
};

export type InferCreationSchema<T extends TableSchema<any>> = {
    [K in keyof T["columns"]as T["columns"][K] extends {
        type: infer Type;
        generated?: infer Generated;
        default?: infer Default;
        nullable?: infer Nullable;
        createDate?: infer CreateDate;
        updateDate?: infer UpdateDate;
    } ? Generated extends true | string ? never
    : CreateDate extends true ? never
    : UpdateDate extends true ? never
    : Nullable extends true ? never
    : Default extends true ? never
    : K : never]:
    T["columns"][K] extends { type: infer Type }
    ? Type extends AnyCallable<infer U>
    ? U
    : never
    : never;
} & {
    [K in keyof T["columns"]as T["columns"][K] extends {
        type: infer Type;
        generated?: infer Generated;
        default?: infer Default;
        nullable?: infer Nullable;
    } ? Generated extends true | string ? K
    : Nullable extends true ? K
    : Default extends true ? K
    : never : never]?:
    T["columns"][K] extends { type: infer Type }
    ? Type extends AnyCallable<infer U>
    ? U
    : never
    : never;
};


