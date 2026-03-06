
/**
 * A Factory is a function that creates and returns an instance of a module or service within the application.
 * It can be synchronous or asynchronous (returning a Promise).
 * 
 * @template App - The type of the application instance.
 * @template T - The type of the module or service being created.
 * @template Config - The type of the configuration object passed to the factory.
 */
export type Factory<
    Context = any,
    T extends object | unknown = unknown,
    Config extends object | undefined = any,
> = (context: Context, config: Config) => T | Promise<T>

export type FactoryCollection<Context = any> = {
    [key: string]: Factory<Context>;
};


/**
 * A ApplicationModule represents an instantiated module within the application.
 */
export type InferFactoryType<T extends Factory> =
    T extends (...args: any[]) => infer Res
    ? Res extends Promise<infer R>
    ? R
    : Res
    : never;

export type InferFactoryCollectionTypes<T extends FactoryCollection = any> = {
    [key in keyof T]: T[key] extends Factory ? InferFactoryType<T[key]> : never;
};


export function isFactory(obj: any): obj is Factory {
    return typeof obj === "function";
}