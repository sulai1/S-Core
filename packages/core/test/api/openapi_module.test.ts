import { describe, test } from "vitest";
import { OpenApiBody, OpenApiMethod, OpenApiPathParameter, OpenApiQueryParameter } from "../../src";
import { OpenApiModule } from "../../src/api/openapi/OpenApiModule";
import { paths } from "./test-api-permanent";

const module: OpenApiModule<paths, {}> = {
    "/pathWithEverything": {
        put: async (req, options) => {

            req.data;
            options?.params?.param1;
            options?.query?.queryParam1;
            return { message: "Received everything" };
        },
    },
    "/pathWithParameters/{param1}": {
        get: async (req) => {
            const r: OpenApiPathParameter<paths, "/pathWithParameters/{param1}", "get"> | undefined = req?.params;
            return { message: `Received path parameter: ${JSON.stringify(r)}` };
        }
    },
    "/pathWithQueryParameters": {
        get: async (req) => {
            const r: OpenApiQueryParameter<paths, "/pathWithQueryParameters", "get"> | undefined = req?.query;
            return { message: `Received query parameters: ${JSON.stringify(r)}` };
        }
    },
    "/pathWithFormUrlEncoded": {
        post: async (req) => {
            const m: OpenApiMethod<paths, "/pathWithFormUrlEncoded", "post"> = async (req) => {
                return { message: `Received form data: ${JSON.stringify(req)}` };
            }
            const r: OpenApiBody<paths, "/pathWithFormUrlEncoded", "post"> = req;
            return { message: `Received form data: ${JSON.stringify(r)}` };
        }
    },
    "/pathWithMultipart": {
        post: async (req) => {
            const r: OpenApiBody<paths, "/pathWithMultipart", "post"> = req;
            return { message: `Received multipart data: ${JSON.stringify(r)}` };
        }
    },
    "/pathWithMultipleStatusCodes": {
        get: async () => {
            return { id: "123", message: "Multiple status codes" };
        }
    },
    "/pathWithOctetStream": {
        post: async (req) => {
            const r: OpenApiBody<paths, "/pathWithOctetStream", "post"> = req;
            return "Received octet stream data";
        }
    },
    "/pathWithPdfBody": {
        post: async (req) => {
            const r: OpenApiBody<paths, "/pathWithPdfBody", "post"> = req;
            return `Received PDF data: ${JSON.stringify(r)}`;
        }
    },
    "/pathWithRequestBody": {
        post: async (req) => {
            const r: OpenApiBody<paths, "/pathWithRequestBody", "post"> = req;
            return { message: `Received request body: ${JSON.stringify(r)}` };
        }
    },
    "/pathWithTextBody": {
        post: async (req) => {
            const r: OpenApiBody<paths, "/pathWithTextBody", "post"> = req;
            return `Received text data: ${JSON.stringify(r)}`;
        }
    }
}

describe("openapi module", () => {
    test("should have correct types for path parameters", () => {
        const res = module["/pathWithEverything"].put({}, { params: { param1: "test" }, query: { queryParam1: 2 } });
        const res1 = module["/pathWithFormUrlEncoded"].post({ field1: "value1", field2: 2 });
        const res2 = module["/pathWithMultipart"].post({ file: "asd" });
        const res3 = module["/pathWithMultipleStatusCodes"].get(undefined);
        const res4 = module["/pathWithOctetStream"].post("Hello");
        const res5 = module["/pathWithParameters/{param1}"].get({ params: { param1: "test" } });
        const res6 = module["/pathWithPdfBody"].post("ads");
        const res7 = module["/pathWithQueryParameters"].get({ query: { queryParam1: "value1", queryParam2: 1 } });
        const res8 = module["/pathWithRequestBody"].post({ data: "Sample Data" });
        const res9 = module["/pathWithTextBody"].post("Hello, plain text!");
    });
})