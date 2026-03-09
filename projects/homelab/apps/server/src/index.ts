import { createApplication } from "@s-core/core";
import { createServer } from "@s-core/server";
import { json } from "express";
import { LokiService } from "./services/LokiService";
import { NginxProxyManagerService } from "./services/NginxProxyManagerService";
import { createProxyFactory } from "./services/proxy";
import { InMemoryTokenStore } from "./store/TokenStore";
import cors from "cors";


export const npmUser = process.env.ADMIN_USER ?? 'admin';
export const npmPassword = process.env.ADMIN_PASSWORD ?? 'admin';

const port = 3000;

export const appCollection = createApplication()
    .addModule("token-store", () => {
        return new InMemoryTokenStore();
    })
    .addModule("node-proxy-manager", (app) => {
        return new NginxProxyManagerService(
            app.getModule("token-store"),
            "https://proxy.sascha-wernegger.me/api",
            npmUser,
            npmPassword
        );
    })
    .addModule("loki", () => {
        return new LokiService(
            "http://192.168.0.4:3100",
            npmUser,
            npmPassword
        );
    })
    .addModule("proxy-factory", createProxyFactory)
    .addModule("server",
        (app) => {
            const server = createServer()
                .use(cors())
                .use(json())
                .use((req, res, next) => {
                    console.log(`[${req.method}] ${req.baseUrl}${req.url}`);
                    next();
                })
                .use("/test", (req, res) => {
                    res.json({ message: "Test successful" });
                })
                .use("/proxy-manager", app.getModule("proxy-factory").create(
                    "https://proxy.sascha-wernegger.me/api",
                    {
                        pathRewrite: { "^/proxy-manager": "" },
                        headers: () => ({
                            "Authorization": `Bearer ${app.getModule("token-store").getToken("npm")?.token ?? ""}`
                        })
                    }
                ))
                .use("/loki", app.getModule("proxy-factory").create(
                    "http://192.168.0.4:3100/loki",
                    {
                        headers: () => ({
                            "Authorization": `Basic ${Buffer.from(`${npmUser}:${npmPassword}`).toString("base64")}`
                        })
                    }
                ));
            // .use(app.getModule("body-parser"));
            app.on("afterStart", async () => {
                await server.listen(port);
            });
            return server;
        }
    );
appCollection.configProvider.setValue("server", "port", process.env.NODE_PORT);
export const app = appCollection.build().then(async app => {
    await app.start();
}).catch(e => {
    console.error("Failed to build application", e);
    process.exit(1);
});
