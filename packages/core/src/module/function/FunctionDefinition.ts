export type FunctionDefinitionReturnType<T extends readonly (readonly unknown[])[]> = {
    [K in keyof T]: T[K] extends readonly [...infer _Rest, infer Last]
    ? Last
    : undefined
} extends infer P ? P extends unknown[] ? P[number] : never : never;

export type FunctionDefinitionParams<T extends readonly (readonly unknown[])[]> = {
    [K in keyof T]: T[K] extends readonly [...infer First, infer _Rest]
    ? First
    : undefined
} extends infer P ? P extends unknown[] ? P[number] : never : never;
