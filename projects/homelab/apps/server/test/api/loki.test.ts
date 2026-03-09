import { LokiService } from "../../src/services/LokiService";

let s: LokiService;
beforeAll(async () => {
    s = new LokiService(
        "http://192.168.0.4:3100",
        process.env.ADMIN_USER ?? 'admin',
        process.env.ADMIN_PASSWORD ?? 'admin'
    );
    // Sleep for 1 second to allow Loki to be ready
    return new Promise((resolve) => setTimeout(resolve, 100));
});

describe("LokiService", () => {
    test("should perform a simple query", async () => {
        const result = s.labels;
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
    });

    test("should perform a readiness check", async () => {
        const result = await s.ready({});
        expect(result).toBeDefined();
        expect(result.data).toBeDefined();
    });

    test("should perform a services check", async () => {
        const result = await s.services({});
        expect(result).toBeDefined();
        expect(typeof result.data).toBe("string");
    });

    test("should perform a services check", async () => {
        const result = await s.buildInfo({});
        expect(result).toBeDefined();
        expect(typeof result.data.version).toBe("string");
    });

    test("should perform a log query", async () => {
        const result = await s.query_range({
            query: '{job!=""} |= "error"',
            limit: 10
        });
        expect(result).toBeDefined();
        expect(result.data.data?.resultType).toBe("streams");
        expect(Array.isArray(result.data.data?.result)).toBe(true);
    });
});
