export type Listener = (event: string, target: any, ...args: any[]) => void;
export interface Emitter<Event extends string = string> {
    on(event: Event, listener: Listener): this;
    off(event: Event, listener: Listener): this;
    emit(event: Event, ...args: any[]): Promise<boolean>;
}

export class DefaultEmitter<Event extends string = string> implements Emitter {
    private listeners: Map<Event, Set<Listener>> = new Map();
    constructor(readonly events?: Event[]) { }

    on(event: Event, listener: Listener): this {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(listener);
        return this;
    }
    off(event: Event, listener: Listener): this {
        this.listeners.get(event)?.delete(listener);
        return this;
    }
    async emit(event: Event, ...args: any[]): Promise<boolean> {
        const eventListeners = this.listeners.get(event);
        if (eventListeners && eventListeners.size > 0) {
            for (const listener of eventListeners) {
                await listener(event, this, ...args);
            }
            return true;
        }
        return false;
    }
}

const def = new DefaultEmitter();
def.on("test", (e, t) => {
    console.log("Event:", e, "Target:", t);
});