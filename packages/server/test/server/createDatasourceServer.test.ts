import { DataSource, DataSourceSchema, SelectFunctionDefinitions } from "@s-core/core";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { createDatasourceServer } from "../../src/server/createDatasourceServer.js";

const Tables = {
    test: {
        name: "test",
        columns: {
            id: {
                type: Number,
                primary: true,
                generated: true,
            },
            name: {
                type: String,
            }
        }
    },
} as const satisfies DataSourceSchema;

describe("createDatasourceServer", () => {
    let mockDataSource: DataSource<typeof Tables, SelectFunctionDefinitions>;
    let serverModule: ReturnType<typeof createDatasourceServer<typeof Tables, SelectFunctionDefinitions>>;

    beforeEach(() => {
        // Create mock datasource
        mockDataSource = {
            get: vi.fn(),
            insert: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            find: vi.fn(),
            select: vi.fn(),
            createRepository: vi.fn(),
        };

        // Create server module
        serverModule = createDatasourceServer(mockDataSource);
    });

    describe("/get endpoint", () => {
        test("should call datasource.get with correct parameters", async () => {
            const key = { id: 1 };
            const expectedResult = { id: 1, name: "test" };
            (mockDataSource.get as any).mockResolvedValue(expectedResult);

            const result = await serverModule["/get"].post({ table: "test", key });

            expect(mockDataSource.get).toHaveBeenCalledWith("test", key);
            expect(result).toEqual(expectedResult);
        });

        test("should return null when record not found", async () => {
            (mockDataSource.get as any).mockResolvedValue(null);

            const result = await serverModule["/get"].post({ table: "test", key: { id: 999 } });

            expect(result).toBeNull();
        });
    });

    describe("/insert endpoint", () => {
        test("should call datasource.insert with correct parameters", async () => {
            const data = [{ name: "test1" }, { name: "test2" }];
            const expectedPks = [{ id: 1 }, { id: 2 }];
            (mockDataSource.insert as any).mockResolvedValue(expectedPks);

            const result = await serverModule["/insert"].post({ table: "test", data });

            expect(mockDataSource.insert).toHaveBeenCalledWith("test", data);
            expect(result).toEqual(expectedPks);
        });

        test("should handle insert with generated ids", async () => {
            const data = [{ name: "newRecord" }];
            const expectedPks = [{ id: 5 }];
            (mockDataSource.insert as any).mockResolvedValue(expectedPks);

            const result = await serverModule["/insert"].post({ table: "test", data });

            expect(mockDataSource.insert).toHaveBeenCalledWith("test", data);
            expect(result).toEqual(expectedPks);
        });
    });

    describe("/update endpoint", () => {
        test("should call datasource.update with correct parameters", async () => {
            const updateData = { name: "updated" };
            const where = [{ function: "=", params: ["id", { value: 1 }] }];
            (mockDataSource.update as any).mockResolvedValue(undefined);

            await serverModule["/update"].post({
                table: "test",
                data: updateData,
                where: where as any
            });

            expect(mockDataSource.update).toHaveBeenCalledWith("test", updateData, where);
        });

        test("should handle partial updates", async () => {
            const partialData = { name: "partial" };
            const where = [{ function: "=", params: ["id", { value: 2 }] }];
            (mockDataSource.update as any).mockResolvedValue(undefined);

            await serverModule["/update"].post({
                table: "test",
                data: partialData,
                where: where as any
            });

            expect(mockDataSource.update).toHaveBeenCalledWith("test", partialData, where);
        });
    });

    describe("/delete endpoint", () => {
        test("should call datasource.delete with correct parameters", async () => {
            const where = [{ function: "=", params: ["id", { value: 1 }] }];
            (mockDataSource.delete as any).mockResolvedValue(undefined);

            await serverModule["/delete"].post({
                table: "test",
                where: where as any
            });

            expect(mockDataSource.delete).toHaveBeenCalledWith("test", where);
        });

        test("should handle complex where conditions", async () => {
            const where = [
                { function: "=", params: ["name", { value: "test" }] },
                { function: ">", params: ["id", { value: 5 }] }
            ];
            (mockDataSource.delete as any).mockResolvedValue(undefined);

            await serverModule["/delete"].post({
                table: "test",
                where: where as any
            });

            expect(mockDataSource.delete).toHaveBeenCalledWith("test", where);
        });
    });

    describe("/find endpoint", () => {
        test("should call datasource.find with correct parameters", async () => {
            const query = {
                where: [{ function: "=", params: ["name", { value: "test" }] }],
                limit: 10,
                offset: 0
            };
            const expectedResults = [{ id: 1, name: "test" }, { id: 2, name: "test" }];
            (mockDataSource.find as any).mockResolvedValue(expectedResults);

            const result = await serverModule["/find"].post({
                table: "test",
                query: query as any
            });

            expect(mockDataSource.find).toHaveBeenCalledWith("test", query);
            expect(result).toEqual(expectedResults);
        });

        test("should handle find with orderBy and groupBy", async () => {
            const query = {
                where: [],
                orderBy: [["name", "asc"]],
                groupBy: ["name"],
                limit: 5
            };
            const expectedResults = [{ id: 1, name: "test" }];
            (mockDataSource.find as any).mockResolvedValue(expectedResults);

            const result = await serverModule["/find"].post({
                table: "test",
                query: query as any
            });

            expect(mockDataSource.find).toHaveBeenCalledWith("test", query);
            expect(result).toEqual(expectedResults);
        });

        test("should handle find with attribute selection", async () => {
            const query = {
                attributes: { id: true, name: true },
                where: []
            };
            const expectedResults = [{ id: 1, name: "test" }];
            (mockDataSource.find as any).mockResolvedValue(expectedResults);

            const result = await serverModule["/find"].post({
                table: "test",
                query: query as any
            });

            expect(mockDataSource.find).toHaveBeenCalledWith("test", query);
            expect(result).toEqual(expectedResults);
        });
    });

    describe("/select endpoint", () => {
        test("should call datasource.select with correct parameters", async () => {
            const tables = { t1: "test" };
            const query = {
                where: [],
                attributes: { id: "test.id", name: "test.name" }
            };
            const expectedResults = [{ id: 1, name: "test" }];
            (mockDataSource.select as any).mockResolvedValue(expectedResults);

            const result = await serverModule["/select"].post({
                tables: tables as any,
                query: query as any
            });

            expect(mockDataSource.select).toHaveBeenCalledWith(tables, query);
            expect(result).toEqual(expectedResults);
        });

        test("should handle multi-table selects", async () => {
            const tables = { t1: "test", t2: "test" };
            const query = {
                where: [],
                attributes: {
                    id1: "test.id",
                    id2: "test.id"
                }
            };
            const expectedResults = [{ id1: 1, id2: 2 }];
            (mockDataSource.select as any).mockResolvedValue(expectedResults);

            const result = await serverModule["/select"].post({
                tables: tables as any,
                query: query as any
            });

            expect(mockDataSource.select).toHaveBeenCalledWith(tables, query);
            expect(result).toEqual(expectedResults);
        });
    });

    describe("type safety", () => {
        test("should maintain type safety for table names", async () => {
            // This should compile - "test" is a valid table
            await serverModule["/get"].post({ table: "test", key: { id: 1 } });

            // TypeScript should catch invalid table names at compile time
            // @ts-expect-error - "invalid" is not a valid table name
            await serverModule["/get"].post({ table: "invalid", key: { id: 1 } });
        });

        test("should maintain type safety for primary keys", async () => {
            // This should compile - id is the primary key
            await serverModule["/get"].post({ table: "test", key: { id: 1 } });

            // TypeScript should catch invalid keys at compile time
            // @ts-expect-error - "wrongKey" is not a valid primary key field
            await serverModule["/get"].post({ table: "test", key: { wrongKey: 1 } });
        });
    });

    describe("error handling", () => {
        test("should propagate errors from datasource.get", async () => {
            const error = new Error("Database connection failed");
            (mockDataSource.get as any).mockRejectedValue(error);

            await expect(
                serverModule["/get"].post({ table: "test", key: { id: 1 } })
            ).rejects.toThrow("Database connection failed");
        });

        test("should propagate errors from datasource.insert", async () => {
            const error = new Error("Duplicate key violation");
            (mockDataSource.insert as any).mockRejectedValue(error);

            await expect(
                serverModule["/insert"].post({ table: "test", data: [{ name: "test" }] })
            ).rejects.toThrow("Duplicate key violation");
        });

        test("should propagate errors from datasource.find", async () => {
            const error = new Error("Invalid query");
            (mockDataSource.find as any).mockRejectedValue(error);

            await expect(
                serverModule["/find"].post({ table: "test", query: {} as any })
            ).rejects.toThrow("Invalid query");
        });
    });
});
