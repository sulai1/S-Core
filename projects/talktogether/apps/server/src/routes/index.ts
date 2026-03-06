import { Api } from "s-api";
import { Router } from "express";


export function makeRoutes<
    A extends Api<string, M>,
    M extends {},
    O extends { params?: {} | undefined } = {}
>(api: A, mod: M, options?: { get: (req: any) => O, set: (req: any, options?: O) => void }): Router {
    const router = Router();
    console.info("************************** " + api.name + " **************************");
    for (const name in mod) {
        const route = api.routes[name];
        console.log("route", route.route);
        switch (route.method) {
            case "get":
                router.get("/" + route.route, async (req, res) => {
                    try {
                        const params = options?.get(req)
                        const result = await (mod[name] as Function)(params);
                        options?.set(req, params);
                        if (result.success)
                            res.json(result.data);
                        else
                            res.status(500).json(result.error);
                    } catch (e) {
                        console.error("InternalServerError", e);
                        res.json({ status: { statusCode: 500, statusMessage: "Internal server error", success: false } });
                    }
                });
                break;
            case "post":
                router.post("/" + route.route, async (req, res) => {
                    try {
                        const params = options?.get(req)
                        const result =      await (mod[name] as Function)(req.body, params);
                        options?.set(req, params);
                        if (result.success)
                            res.json(result.data);
                        else
                            res.status(500).send(result.error.original.message);
                    } catch (e) {
                        console.error("InternalServerError", e);
                        res.json({ status: { statusCode: 500, statusMessage: "Internal server error", success: false } });
                    }
                });
                break;
            default:
                break;
        }
    }
    return router;
}