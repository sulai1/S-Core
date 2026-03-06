import { readFile, writeFile } from "fs/promises";
import { Application } from "./Application";


export type ConfigProvider<T extends object> = {
    getConfig<K extends keyof T>(name: K): T[K];
    setConfig<K extends keyof T>(name: K, config: T[K]): void;
    setValue<K extends keyof T, P extends keyof T[K]>(name: K, key: P, value: T[K][P]): void;
    getValue<K extends keyof T, P extends keyof T[K]>(name: K, key: P): T[K][P];
    save(): Promise<void>;
    load(): Promise<void>;
};



export class DefaultConfigProvider<T extends Record<string, Record<string, any>>> implements ConfigProvider<T> {
    private config = {} as T;
    constructor(
        readonly configPath: string
    ) {
    }
    getConfig<K extends keyof T>(name: K): T[K] {
        return this.config[name];
    }
    setConfig<K extends keyof T>(name: K, config: T[K]): void {
        this.config[name] = config;
    }
    setValue<K extends keyof T, P extends keyof T[K]>(
        name: K,
        key: P,
        value: T[K][P]
    ): void {
        if (!this.config[name]) {
            this.config[name] = {} as T[K];
        }
        this.config[name][key] = value;
    }
    getValue<K extends keyof T, P extends keyof T[K]>(name: K, key: P): T[K][P] {
        return this.config[name][key];
    }
    async save(): Promise<void> {
        const cfg = JSON.stringify(this.config, null, 4);
        await writeFile(this.configPath, cfg, { encoding: "utf-8" });
    }
    async load(): Promise<void> {
        const data = await readFile(this.configPath, { encoding: "utf-8" });
        this.config = JSON.parse(data) as T;
    }
}