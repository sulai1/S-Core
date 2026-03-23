import { console, Tracer } from "tracer";
import { Logger } from "@s-core/core";

export class ConsoleLogger implements Logger {
    logger: Tracer.Logger<string>;
    constructor() {
        this.logger = console({
            format: "{{timestamp}} <{{title}}> [{{file}}:{{line}}] {{message}}",
        })
        
    }
    log(...parts: unknown[]) {
        this.logger.log(...parts);
    }
    warn(...parts: unknown[]) {
        this.logger.warn(...parts);
    }
    error(...parts: unknown[]) {
        this.logger.error(...parts);
    }
    info(...parts: unknown[]) {
        this.logger.info(...parts);
    }
}