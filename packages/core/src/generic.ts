export type AnyConstructor<T = any> = new (...args: any[]) => T;
export type AnyCallable<T = any> = (...args: any[]) => T;

// Accepts either a constructor or a callable (like BigInt, String, Number, etc.)
export type ConstructorOrCallable<T = any> = AnyConstructor<T> | AnyCallable<T>;

export type Constructor<T = unknown, A extends unknown[] = unknown[]> = new (...args: A) => T;

export type StringKeysOfType<
    Obj extends object,
    TargetType
> = {
    [K in keyof Obj]: Obj[K] extends TargetType ? K : never;
}[keyof Obj] & string;

export type Prettify<T> = {
    [K in keyof T]: T[K];
};

type _Flatten<T, Prefix extends string = ""> = {
    [K in keyof T & (string | number)]: T[K] extends object
    ? _Flatten<T[K], `${Prefix}${K}.`>
    : { [P in `${Prefix}${K}`]: T[K] }
}[keyof T & (string | number)];

// This produces a union of records, so we need to merge them:
type Merge<U> = (
    U extends any ? (k: U) => void : never
) extends (k: infer I) => void ? { [K in keyof I]: I[K] } : never;

export type Flatten<T> = Merge<_Flatten<T>>;


type JoinWithRename<
    Tables,
    RenameMap extends Record<string, keyof Tables & string>,
    Separator extends string = "."
> = {
    [NewName in keyof RenameMap & string]:
    Tables[RenameMap[NewName]] extends object
    ? {
        [P in keyof Tables[RenameMap[NewName]] & string as `${NewName}${Separator}${P}`]:
        Tables[RenameMap[NewName]][P]
    }
    : never
}[keyof RenameMap & string];

export type Join<T, RenameMap extends Record<string, keyof T & string>> = Merge<JoinWithRename<T, RenameMap>>;

export type Last<T> = T extends [...infer _, infer L] ? L : never;

export type RemoveNeverProps<T extends object> = {
    [K in keyof T as T[K] extends never ? never : K]: T[K];
};
