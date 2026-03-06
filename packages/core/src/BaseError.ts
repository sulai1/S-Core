type Jsonable = string | number | boolean | null | undefined | readonly Jsonable[] | {
    readonly [key: string]: Jsonable;
} | {
    toJSON(): Jsonable;
};
export class BaseError extends Error {
    readonly context?: Jsonable | undefined;
    constructor(message: string, options?: {
        cause?: Error | undefined;
        context?: Jsonable | undefined;
    }){
        super(message,{
            cause: options?.cause
        });
        this.name = "BaseError";
        this.context = options?.context;
    };

    toString() {
        return `${this.name}: ${this.message} ${this.context ? '| Context: ' + JSON.stringify(this.context) : ''}`;
    }
}