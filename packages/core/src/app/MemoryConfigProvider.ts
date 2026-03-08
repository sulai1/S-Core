import { ConfigProvider } from "./ConfigProvider.js";


export class MemoryConfigProvider<T extends object = Record<string, any>> implements ConfigProvider<T> {
    private config = {} as T;
    constructor() {
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
        // No-op for in-memory provider
    }
    async load(): Promise<void> {
        // No-op for in-memory provider
    }
}
