type ReactiveObject<T> = {
    [K in keyof T]: T[K];
} & {
    [observeSymbol]: (observer: Observer<T>) => () => void;
    [unobserveSymbol]: (observer: Observer<T>) => void;
};

export function reactiveCompare<T extends object>(obj1: T, obj2: T): boolean {
    const keys1 = Object.keys(obj1) as (keyof T)[];
    const keys2 = Object.keys(obj2) as (keyof T)[];
    if (keys1.length !== keys2.length) {
        return false;
    }
    for (const key of keys1) {
        if (obj1[key] !== obj2[key]) {
            return false;
        }
    }
    return true;
}

// Symbols for observer methods
export const observeSymbol = Symbol('observe');
export const unobserveSymbol = Symbol('unobserve');

type Observer<T> = (property: keyof T, newValue: any, oldValue: any) => void;

interface ReactiveOptions {
    deep?: boolean;
}
/** 
 * A reactive object that notifies observers on property changes.
 * Comparing reactive objects with === does not work as expected, 
 * use observe/unobserve to track changes, or use the reactiveCompare.
 * @param obj 
 * @param options if deep is true, nested objects are also made reactive
 * @returns 
 */
export function reactive<T extends object>(
    obj: T,
    options: ReactiveOptions = {}
): ReactiveObject<T> {
    const { deep = false } = options;
    const observers: Set<Observer<T>> = new Set();
    const storage: Map<keyof T, unknown> = new Map();

    // Initialize storage with original values
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (deep && isObject(value)) {
                // Create nested reactive and bubble up changes
                const nested = reactive(value as object, { deep });
                // Bubble up changes from nested
                observe(nested, (nestedKey, newValue, oldValue) => {
                    notifyObservers(key as keyof T, nested, nested); // Pass the nested object as new/old value
                });
                storage.set(key, nested);
            } else {
                storage.set(key, value);
            }
        }
    }

    const proxy = {} as ReactiveObject<T>;

    // Create getters and setters for each property
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            Object.defineProperty(proxy, key, {
                get() {
                    return storage.get(key);
                },
                set(newValue: object) {
                    const oldValue = storage.get(key);
                    if (oldValue !== newValue) {
                        const valueToStore = deep
                            && isObject(newValue)
                            ? reactive(newValue)
                            : newValue;
                        storage.set(key, valueToStore);
                        notifyObservers(key, newValue, oldValue);
                    }
                },
                enumerable: true,
                configurable: true,
            });
        }
    }

    function notifyObservers(property: keyof T, newValue: any, oldValue: any) {
        observers.forEach((observer) => observer(property, newValue, oldValue));
    }

    // Attach observer management methods using symbols
    proxy[observeSymbol] = (observer: Observer<T>) => {
        observers.add(observer);
        return () => observers.delete(observer);
    };

    proxy[unobserveSymbol] = (observer: Observer<T>) => {
        observers.delete(observer);
    };

    return proxy;
}

function isObject(value: any): boolean {
    return value !== null && typeof value === 'object'; // arrays are objects too
}


// Utility function to observe a reactive object
export function observe<T extends object>(
    reactiveObj: ReactiveObject<T>,
    observer: Observer<T>
): () => void {
    if (typeof (reactiveObj[observeSymbol]) === 'function') {
        return reactiveObj[observeSymbol](observer);
    }
    throw new Error('Object is not reactive');
}

// Utility function to unobserve a reactive object
export function unobserve<T extends object>(
    reactiveObj: ReactiveObject<T>,
    observer: Observer<T>
): void {
    if (typeof (reactiveObj[unobserveSymbol]) === 'function') {
        reactiveObj[unobserveSymbol](observer);
        return;
    }
    throw new Error('Object is not reactive');
}


