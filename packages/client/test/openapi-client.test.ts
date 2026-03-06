import path from "path";
import "reflect-metadata";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { paths } from "./test-api-permanent";
import { createOpenApiClient } from "../src";
import { ApiError } from "@s-core/core";

export const client = {
    get: vi.fn(),
    delete: vi.fn(),
    head: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
};

describe('API Tests', async () => {

    const m = await createOpenApiClient<paths>(
        path.resolve(__dirname, "../test/schema.yaml"),
        client
    );

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('should correctly call the get function', async () => {
        client.get.mockResolvedValueOnce({ data: { res: "1" }, status: 200, statusText: "Ok" });
        if (m["/pathWithMultipleStatusCodes"].get === undefined) throw new Error("get method is undefined");
        const res = await m["/pathWithMultipleStatusCodes"].get({ timeout: 1234 });
        expect(client.get).toHaveBeenCalledWith('/pathWithMultipleStatusCodes', { timeout: 1234, params: undefined, query: undefined });
        expect(res).toEqual({ res: "1" });
    });

    test('should correctly call the post function', async () => {
        client.post.mockResolvedValueOnce({ data: { res: "2" }, status: 200, statusText: "Ok" });
        const res = await m["/pathWithRequestBody"].post({ data: "1" }, { timeout: 1234, });
        expect(client.post).toHaveBeenCalledWith('/pathWithRequestBody', { data: "1" }, { timeout: 1234, params: undefined, query: undefined });
        expect(res).toEqual({ res: "2" });
    });

    test('should create ApiError with all options provided', () => {
        const errorMessage = 'Internal Server Error';
        const error = new ApiError(
            'http://example.com/api',
            {
                cause: new Error('Underlying cause'),
                expectedStatus: [404],
                status: 500,
                statusText: errorMessage
            }
        );
        const message = error.message;
        expect(message).toContain('http://example.com/api');
        expect(message).toContain(errorMessage);
        expect(message).toContain('expected status 500 to be 404');
        expect(error.cause).toBeInstanceOf(Error);
        expect((error.cause as Error).message).toBe('Underlying cause');
        expect(error.context).toEqual({ status: 500, statusText: errorMessage });
    });

    test('should create ApiError with minimal options', () => {
        const error = new (ApiError)('url');
        expect(error.message).toContain('url');
        expect(error.message).toContain('expected status undefined to be 200');
        expect(error.cause).toBeUndefined();
        expect(error.context).toEqual({ status: undefined, statusText: undefined });
    });

    test('should set expectedStatus to 200 if not provided', () => {
        const error = new (ApiError)(
            'url',
            { status: 400, statusText: 'Bad Request' }
        );
        expect(error.message).toContain('expected status 400 to be 200');
        expect(error.context).toEqual({ status: 400, statusText: 'Bad Request' });
    });

});
