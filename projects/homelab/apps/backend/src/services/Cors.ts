import { type Handler } from "@s-tek/api";
import cors from "cors";

export function createCors(
    options?: Pick<cors.CorsOptions, "origin" | "credentials" | "methods" | "allowedHeaders">
): () => Handler<any, any> {
    const defaultOrigins: cors.CorsOptions["origin"] = [
        /^http:\/\/localhost:\d+$/,
        /^http:\/\/127\.0\.0\.1:\d+$/
    ];

    return () => cors({
        origin: options?.origin ?? defaultOrigins,
        credentials: options?.credentials ?? true,
        methods: options?.methods ?? ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: options?.allowedHeaders ?? [
            "Origin",
            "X-Requested-With",
            "Content-Type",
            "Accept",
            "Authorization"
        ]
    });
}
