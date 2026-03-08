

export type ConfigProvider<T extends object> = {
    getConfig<K extends keyof T>(name: K): T[K];
    setConfig<K extends keyof T>(name: K, config: T[K]): void;
    setValue<K extends keyof T, P extends keyof T[K]>(name: K, key: P, value: T[K][P]): void;
    getValue<K extends keyof T, P extends keyof T[K]>(name: K, key: P): T[K][P];
    save(): Promise<void>;
    load(): Promise<void>;
};
