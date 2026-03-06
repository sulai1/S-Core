import { describe, expect, test, beforeEach } from "vitest";
import { clientDatasource, datasource, client } from "./common";


describe("Datasource Client - Schema Conformance", () => {
    beforeEach(() => {
        // Reset all mocks before each test
        client.post.mockReset();
        datasource.get.mockReset();
        datasource.insert.mockReset();
        datasource.update.mockReset();
        datasource.delete.mockReset();
        datasource.find.mockReset();
        datasource.select.mockReset();
    });

    describe("/get endpoint", () => {
        test("should send { table, key } according to schema", async () => {
            const expectedKey = { id: 1 };
            client.post.mockResolvedValue({ status: 200, data: { id: 1, name: "test1" } });

            await clientDatasource.get("test", expectedKey);

            // Verify client sends correct payload structure
            expect(client.post).toHaveBeenCalledWith("/get", {
                table: "test",
                key: expectedKey
            });
        });

    });

    describe("/insert endpoint", () => {
        test("should send { table, data } according to schema", async () => {
            const insertData = [{ name: "test1" }, { name: "test2" }];
            client.post.mockResolvedValue({ status: 200, data: [{ id: 1 }, { id: 2 }] });

            await clientDatasource.insert("test", insertData);

            // Verify client sends correct payload structure
            expect(client.post).toHaveBeenCalledWith("/insert", {
                table: "test",
                data: insertData
            });
        });

    });

    describe("/update endpoint", () => {
        test("should send { table, data, where } according to schema", async () => {
            const updateData = { name: "updated" };
            const whereCondition = [{ function: "=", params: ["id", { value: 1 }] }];
            client.post.mockResolvedValue({ status: 200, data: undefined });

            await clientDatasource.update("test", updateData, whereCondition as any);

            // Verify client sends correct payload structure
            expect(client.post).toHaveBeenCalledWith("/update", {
                table: "test",
                data: updateData,
                where: whereCondition
            });
        });

       
    });

    describe("/delete endpoint", () => {
        test("should send { table, where } according to schema", async () => {
            const whereCondition = [{ function: "=", params: ["id", { value: 1 }] }];
            client.post.mockResolvedValue({ status: 200, data: undefined });

            await clientDatasource.delete("test", whereCondition as any);

            // Verify client sends correct payload structure
            expect(client.post).toHaveBeenCalledWith("/delete", {
                table: "test",
                where: whereCondition
            });
        });

    });

    describe("/find endpoint", () => {
        test("should send { table, query } according to schema", async () => {
            const query = {
                where: [{ function: "=", params: ["name", { value: "test" }] }],
                orderBy: [{ column: "id", order: "asc" }],
                limit: 10
            };
            client.post.mockResolvedValue({ status: 200, data: [{ id: 1, name: "test" }] });

            await clientDatasource.find("test", query as any);

            // Verify client sends correct payload structure (NOT spread)
            expect(client.post).toHaveBeenCalledWith("/find", {
                table: "test",
                query: query
            });
        });


        test("should handle find with attributes selection", async () => {
            const query = {
                attributes: { id: true, name: true },
                where: []
            };
            client.post.mockResolvedValue({ status: 200, data: [{ id: 1, name: "test" }] });

            await clientDatasource.find("test", query as any);

            expect(client.post).toHaveBeenCalledWith("/find", {
                table: "test",
                query: query
            });
        });
    });

    describe("/select endpoint", () => {
        test("should send { tables, query } according to schema", async () => {
            const tables = { t1: "test" } as const;
            const query = {
                where: [],
                attributes: { t1: { id: true, name: true } }
            };
            client.post.mockResolvedValue({ status: 200, data: [{ id: 1, name: "test" }] });

            await clientDatasource.select(tables, query as any);

            // Verify client sends correct payload structure (NOT spread)
            expect(client.post).toHaveBeenCalledWith("/select", {
                tables: tables,
                query: query
            });
        });

    });

    describe("error handling", () => {
        test("should throw error on invalid table for insert", async () => {
            client.post.mockResolvedValue({ status: 400, data: null });

            await expect(
                clientDatasource.insert("invalid_table" as any, [{ name: "test" }] as any)
            ).rejects.toThrow();
        });

        test("should throw error on failed get", async () => {
            client.post.mockResolvedValue({ status: 404, statusText: "Not Found", data: null });

            await expect(
                clientDatasource.get("test", { id: 999 })
            ).rejects.toThrow("Failed to get: 404 Not Found");
        });

        test("should throw error on failed find", async () => {
            client.post.mockResolvedValue({ status: 500, statusText: "Internal Server Error", data: null });

            await expect(
                clientDatasource.find("test", { where: [] })
            ).rejects.toThrow("Failed to find: 500 Internal Server Error");
        });
    });
});
