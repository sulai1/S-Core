import { Application } from "./Application.js";
import { ApplicationModuleCollection } from "./DefaultApplication.js";

export * from "./Application.js";
export * from "./ConfigProvider.js";
export * from "./Version.js";
export * from "./DefaultApplication.js";
export * from "./Emitter.js";
export * from "./Factory.js";
export * from "./ModuleCollection.js";
export * from "./MemoryConfigProvider.js";
export * from "./Reactive.js";
export * from "./Version.js";

// Factory function for creating application
export function createApplication(app?: Partial<Application<{}>>): ApplicationModuleCollection<{}> {
    const appInstance = new ApplicationModuleCollection<{}>();
    if (app) {
        Object.assign(appInstance, app);
    }
    return appInstance;
}
