import { Prettify } from "../generic";
import { Emitter } from "./Emitter";
import { Factory, FactoryCollection, InferFactoryType } from "./Factory";

/**
 * A Application instance that manages modules and their lifecycle. Includes methods to add, remove, and access modules,
 * all while maintaining type safety for the modules managed within the application. 
 * 
 * @template Collection - The factories for the modules in the application.
 */
export interface ModuleCollection<Collection extends FactoryCollection = FactoryCollection, M extends ModuleProvider<Collection> = ModuleProvider<Collection>> {

    /**
     * Adds a module to the application and initializes it. 
     * If the factory returns a Promise, the method will also return a Promise, allowing for asynchronous initialization.
     * @param name - The name of the module.
     * @param module - The factory function to create the module.
     * @param defaults - The default configuration for the module.
     */
    addModule<
        K extends string,
        T,
    >(
        name: K,
        module: Factory<M, T>,
    ): ModuleCollection<AddModule<Collection, K, Factory<M, T>>>;

    /**
     * Removes a module from the application.
     * @param name - The name of the module to remove.
     */
    removeModule<K extends keyof Collection>(
        name: K
    ): ModuleCollection<RemoveModule<Collection, K>>;

    /**
     * Checks if a module exists in the application.
     * @param module - The name of the module to check.
     */
    hasModule(module: string): module is string & keyof Collection;

    build(): Promise<M>;
}

/**
 * Events emitted by the Application instance
 * @template T - The type of the event, either "before" or "after".
 */
export type ModuleCollectionEvent<T extends "before" | "after" = "before" | "after"> = `${T}Start` | `${T}Stop`

export type ModuleProvider<Collection extends FactoryCollection = any> = Emitter<ModuleCollectionEvent> & {
    /**
     * Retrieves a module from the application.
     * @param name - The name of the module to retrieve.
     */
    getModule<K extends keyof Collection>(name: K): InferFactoryType<Collection[K]>;
}
/**
 * Adds a module to the ApplicationFactories type
 * @template T - The original ApplicationFactories type.
 * @template K - The key of the module to add.
 * @template G - The factory type of the module to add.
 */

export type AddModule<
    T extends FactoryCollection,
    K extends string | number | symbol,
    G extends Factory
> = T extends object ? Prettify<{
    [P in (K | keyof T)]: P extends keyof T ? T[P] : G;
}> : Prettify<{
    [P in K]: G;
}>;
/**
 * Removes a module from the ApplicationFactories type
 * @template T - The original ApplicationFactories type.
 * @template K - The key of the module to remove.
 */

export type RemoveModule<T extends FactoryCollection, K extends keyof T> = Prettify<{
    [key in Exclude<keyof T, K>]: T[key];
}>;

