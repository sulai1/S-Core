import { FactoryCollection } from "./Factory";
import { ModuleProvider } from "./ModuleCollection";
;

export type Application<Collection extends FactoryCollection = any> = ModuleProvider<Collection> & {

    /**
     * Starts the application and initializes all modules.
     */
    start(): Promise<void>;

    /**
     * Stops the application and cleans up all modules.
     */
    stop(): Promise<void>;
}
