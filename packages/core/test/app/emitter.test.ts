import { describe, expect, test, vi } from "vitest";
import { DefaultEmitter } from "../../src/app/Emitter";

describe("Emitter", () => {
    test("should check for event listener existence", async () => {
        const emitter = new DefaultEmitter();
        const listener = vi.fn();

        emitter.on("testEvent", listener);
        expect(await emitter.emit("testEvent", 1, 2)).toBe(true);
        expect(listener).toHaveBeenCalledWith("testEvent", emitter, 1, 2);

        emitter.off("testEvent", listener);
        expect(await emitter.emit("testEvent", 1, 2)).toBe(false);
        expect(listener).toHaveBeenCalledTimes(1);
    });
});