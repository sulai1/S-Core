import type { ApiModule, HttpRequest } from "@s-tek/api";
import z from "zod";

export const testApi = {
    name: "test", routes: {
        "a": {
            get: {
                method: "get" as const,
                contentType: "application/json" as const,
                statusOk: [200],
                response: z.object({ test: z.string() })
            }
        },
        "b": {
            post: {
                method: "post" as const,
                contentType: "application/json" as const,
                statusOk: [201],
                request: z.object({ req: z.string() }),
                response: z.object({ test: z.boolean() })
            }
        }
    }
};

export const testRouter: ApiModule<typeof testApi> = {
    a: {
        get: () => {
            return Promise.resolve({ test: "success" });
        }
    },
    b: {
        post: (req) => {
            const requestData = req.body.req;
            return Promise.resolve({ test: requestData === "ping" });
        }
    },
    index: async () => {
        return Promise.resolve(["a", "b"]);
    }
};
