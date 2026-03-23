export type Logger = {
    log: (...parts: unknown[]) => void;
    warn: (...parts: unknown[]) => void;
    error: (...parts: unknown[]) => void;
    info: (...parts: unknown[]) => void;
};