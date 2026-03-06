import { Application } from "./Application";
import { ApplicationModuleCollection } from "./DefaultApplication";

export * from "./Application";
export * from "./ConfigProvider";
export * from "./Version";

// Factory function for creating application
export function createApplication(app?: Partial<Application<{}>>): ApplicationModuleCollection<{}> {
    const appInstance = new ApplicationModuleCollection<{}>();
    if (app) {
        Object.assign(appInstance, app);
    }
    return appInstance;
}
