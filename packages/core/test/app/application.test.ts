import { beforeEach, describe, expect, test, vi } from "vitest";
import { Application, createApplication } from "../../src";
import { InferFactoryType } from "../../src/app/Factory";
import { ApplicationModuleCollection } from "../../src/app/DefaultApplication";

const t: InferFactoryType<() => { test: string }> = {
    test: "value"
};
describe("Application", () => {
    let collection: ApplicationModuleCollection<{}>;
    beforeEach(() => {
        collection = createApplication();
    });


    test("should provide an app to the module factory", async () => {
        const fn = vi.fn((app: Application<{}>) => {
            expect(app).toBeDefined();
            expect(app).toHaveProperty("getModule");
            return { a: "b" };
        });
        const newCollection = collection.addModule("test", fn);
        const newApp = await newCollection.build();
        const testApi = newApp.getModule("test");
        expect(testApi).toBeDefined();
        expect(fn).toHaveBeenCalled()
        expect(testApi).toHaveProperty("a", "b");
    });
    test("should add, get API, and set config for modules", async () => {
        const newCollection = collection.addModule("test", () => { return { a: "b" }; });
        const newApp = await newCollection.build();
        const testApi = newApp.getModule("test");
        expect(testApi).toBeDefined();
        expect(testApi).toHaveProperty("a", "b");
    });

    test("should error on missing module", async () => {
        const app = await collection.build();
        // @ts-expect-error Intentional: testing runtime behavior for missing module
        expect(() => app.getModule("unknown")).toThrow("Module 'unknown' not found in application.");
    });

    test("should allow to add dependent module if dependencies are met", async () => {
        const apiMethod = vi.fn();
        const depCollection = collection
            .addModule("test", () => { return { apiMethod }; })
            .addModule("dependent", (app, config) => {
                return {
                    anotherApiMethod: () => {
                        app.getModule("test").apiMethod();
                    }
                };
            });

        const depApp = await depCollection.build();
        depApp.getModule("test").apiMethod();

        depCollection.addModule("anyModule", () => { return {}; });
        const newDepApp = await depCollection.build();
        expect(newDepApp.getModule("test").apiMethod).toHaveBeenCalled();

        newDepApp.getModule("test").apiMethod = vi.fn();
        newDepApp.getModule("dependent").anotherApiMethod();
        expect(newDepApp.getModule("test").apiMethod).toHaveBeenCalled();

        const test = newDepApp.getModule("test");
        expect(test).toBeDefined();
        expect(test).toHaveProperty("apiMethod");


        const dependent = newDepApp.getModule("dependent");
        expect(dependent).toBeDefined();
        expect(dependent).toHaveProperty("anotherApiMethod");
    });

    test("should remove module", async () => {
        const testApp = collection.addModule("test", () => { return { apiMethod: () => { } }; });
        const newCollection = testApp.addModule("dependent", (app) => {
            return { anotherApiMethod: () => app.getModule("test").apiMethod() };
        });
        const afterRemovalApp = newCollection.removeModule("test");
        const app = await afterRemovalApp.build();
        // @ts-expect-error Intentional: testing runtime behavior for removed module
        expect(() => app.getModule("test")).toThrow("Module 'test' not found in application.");
        // Dependent module should still be present
        const dependent = app.getModule("dependent");
        expect(dependent).toBeDefined();
        expect(dependent).toHaveProperty("anotherApiMethod");
    });

    test("should add a module asynchronously", async () => {
        const app = createApplication()
            .addModule("a", async (app) => {
                return "a"
            })
            .addModule("b", () => "b");
        const builtApp = await app.build();

        expect(builtApp.getModule("a")).toBe("a");
        expect(builtApp.getModule("b")).toBe("b");
    });
});