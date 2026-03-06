import { describe, expect, it, test, vi } from "vitest";
import { observe, reactive, reactiveCompare, unobserve } from "../../src/app/Reactive";

describe("Reactive", () => {
    test("should create a reactive object and observe changes", () => {
        const original = {
            name: "Alice",
            age: 30,
            address: {
                city: "Wonderland",
                zip: "12345"
            }
        };

        const r = reactive(original, { deep: true });

        const observer = vi.fn();
        observe(r, observer);

        expect(r.name).toBe("Alice");
        r.name = "Bob";
        expect(r.name).toBe("Bob");
        expect(observer).toHaveBeenCalledWith("name", "Bob", "Alice");

        expect(original.name).toBe("Alice"); // original should remain unchanged
    });
    test("should delete observer correctly", () => {

        const observer = vi.fn();
        const original = { name: "Eve" };
        const r = reactive(original);
        unobserve(r, observer);

        r.name = "Eve";
        expect(r.name).toBe("Eve");
        expect(observer).not.toHaveBeenCalled();
    });

    test("should observe nested object changes when deep is true", () => {
        const original = {
            user: {
                name: "Charlie",
                details: {
                    age: 25
                }
            }
        };
        const r = reactive(original, { deep: true });

        const observer = vi.fn();
        observe(r, observer);
        r.user.details.age = 26;

        expect(r.user.details.age).toBe(26);
        expect(observer.mock.calls[0][0]).toBe("user");
        expect(reactiveCompare(observer.mock.calls[0][1], r.user)).toBe(true);
    });
    test("should observe nested array changes when deep is true", () => {
        const original = {
            user: {
                name: "Charlie",
                details: [{
                    age: 25
                }]
            }
        };
        const r = reactive(original, { deep: true });

        const observer = vi.fn();
        observe(r, observer);
        r.user.details[0].age = 26;

        expect(r.user.details[0].age).toBe(26);
        expect(observer.mock.calls[0][0]).toBe("user");
        expect(reactiveCompare(observer.mock.calls[0][1], r.user)).toBe(true);
    });
});