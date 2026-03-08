import { Application } from "./Application.js";
import { ConfigProvider } from "./ConfigProvider.js";
import { MemoryConfigProvider } from "./MemoryConfigProvider.js";
import { DefaultEmitter } from "./Emitter.js";
import { Factory, FactoryCollection, InferFactoryCollectionTypes, InferFactoryType } from "./Factory.js";
import { AddModule, ModuleCollection, ModuleCollectionEvent, RemoveModule } from "./ModuleCollection.js";

type AppConfig<T extends Application> = T extends Application<infer M> ? {
    [K in keyof M]: M[K] extends (...args: any[]) => any ? Parameters<M[K]>[1] : never;
} : never;

type ApplicationConfig<T extends FactoryCollection> = {
    configProvider?: ConfigProvider<AppConfig<Application<T>>>;
    configPath?: string;
};

export class ApplicationModuleCollection<Collection extends FactoryCollection = never> implements ModuleCollection<Collection, Application<Collection>> {

    public get initialized() {
        return this._initialized;
    }
    private _initialized = false;
    private definitionOrder: (keyof Collection)[] = [];
    private definitions = {} as Collection;
    private addDefinition<K extends keyof Collection>(name: K, factory: Collection[K]) {
        this.definitions[name] = factory;
        this.definitionOrder.push(name);
    }
    private deleteDefinition<K extends keyof Collection>(name: K) {
        delete this.definitions[name];
        this.definitionOrder = this.definitionOrder.filter(k => k !== name);
    }

    readonly modules: InferFactoryCollectionTypes<Collection> = {} as InferFactoryCollectionTypes<Collection>;

    readonly configProvider: ConfigProvider<AppConfig<Application<Collection>>>;

    constructor(options?: ApplicationConfig<Collection>) {
        this.configProvider = options?.configProvider ?? new MemoryConfigProvider();
    }
    addModule<K extends string, T>(name: K, module: Factory<Application<Collection>, T>)
        : ApplicationModuleCollection<AddModule<Collection, K, Factory<Application<Collection>, T>>> {
        this.addDefinition(name, module as unknown as Collection[K]);
        return this as unknown as ApplicationModuleCollection<AddModule<Collection, K, Factory<Application<Collection>, T>>>;
    }

    // Remove module with compile-time type tracking
    removeModule<K extends keyof Collection>(
        name: K
    ): ApplicationModuleCollection<RemoveModule<Collection, K>> {
        const newApp = this;
        delete newApp.modules[name as keyof Collection];
        this.deleteDefinition(name);
        return newApp as unknown as ApplicationModuleCollection<RemoveModule<Collection, K>>;
    }

    // Check if module exists
    hasModule(module: string): module is string & keyof Collection {
        for (const modName of Object.keys(this.modules)) {
            if (modName === module) {
                return true;
            }
        }
        return false;
    }

    async build(): Promise<Application<Collection>> {

        const app = new DefaultApplication<Collection>({} as { [P in keyof Collection]: InferFactoryType<Collection[P]> })
        for (const name of this.definitionOrder) {
            const def = this.definitions[name];
            const config = this.configProvider.getConfig(name);
            app.modules[name] = await def(app, config) as typeof app.modules[typeof name];
        }
        return app;
    }
}

class DefaultApplication<Collection extends FactoryCollection = never> extends DefaultEmitter<ModuleCollectionEvent> implements Application<Collection> {

    constructor(
        readonly modules = {} as { [P in keyof Collection]: InferFactoryType<Collection[P]> },
    ) {
        super();
    }

    async start(): Promise<void> {
        await this.emit("beforeStart");
        await this.emit("afterStart");
    }

    async stop(): Promise<void> {
        await this.emit("beforeStop");
        await this.emit("afterStop");
    }

    getModule<K extends keyof Collection>(name: K): InferFactoryType<Collection[K]> {
        if (!this.modules[name]) {
            throw new Error(`Module '${String(name)}' not found in application.`);
        }
        return this.modules[name] as InferFactoryType<Collection[K]>;
    }

}