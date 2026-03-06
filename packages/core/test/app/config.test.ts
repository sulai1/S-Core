import { afterEach, describe, expect, test } from "vitest";
import { DefaultConfigProvider } from "../../src/app/ConfigProvider.js";
import fs from "fs/promises";
import path from "path";

const configPath = path.join(__dirname, "test-config.json");
const configProvider = new DefaultConfigProvider(configPath);

describe("AppConfigProvider", () => {
    afterEach(async () => {
        // Clean up the config file after each test
        await fs.unlink(configPath).catch(() => { });
    });
    test("should set and get config values correctly", () => {
        configProvider.setConfig("test", { conf: "value" });

        const config = configProvider.getConfig("test");
        expect(config).toEqual({ conf: "value" });

        const value = configProvider.getValue("test", "conf");
        expect(value).toEqual("value");

        configProvider.setValue("test", "conf", "newValue");
        const newValue = configProvider.getValue("test", "conf");
        expect(newValue).toEqual("newValue");
    });

    test("save and load config from file", async () => {
        configProvider.setConfig("test", { conf: "fileValue" });
        await configProvider.save();
        const newConfigProvider = new DefaultConfigProvider(configPath);
        await newConfigProvider.load();
        const loadedConfig = newConfigProvider.getConfig("test");
        expect(loadedConfig).toEqual({ conf: "fileValue" });
    });
});
