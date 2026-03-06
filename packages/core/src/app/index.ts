import { Application } from "./Application.js";
import { ApplicationModuleCollection } from "./DefaultApplication.js";

export * from "./Application.js";
export * from "./ConfigProvider.js";
export * from "./Version.js";

// Factory function for creating application
export function createApplication(app?: Partial<Application<{}>>): ApplicationModuleCollection<{}> {
    const appInstance = new ApplicationModuleCollection<{}>();
    if (app) {
        Object.assign(appInstance, app);
    }
    return appInstance;
}
