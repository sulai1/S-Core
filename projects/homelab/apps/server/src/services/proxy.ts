import { RequestHandler } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

export let cachedToken: { token: string; expiresAt: number };

export function createProxyFactory(): ProxyFactory {
    return new HttpProxyFactory();
}

export type ProxyOptions = {
    changeOrigin?: boolean;
    secure?: boolean;
    pathRewrite?: { [key: string]: string };
    headers?: () => { [key: string]: string };
};

export type ProxyFactory = {
    create: (target: string, options?: ProxyOptions) => RequestHandler;
}

class HttpProxyFactory implements ProxyFactory {
    create(target: string, options?: ProxyOptions): RequestHandler {
        return createProxyMiddleware({
            target: target,
            changeOrigin: true,
            pathRewrite: options?.pathRewrite,
            secure: options?.secure ?? true,
            on: {
                proxyReq: (proxyReq) => {
                    console.log(`Proxying request to: ${target}`);
                    if (options?.headers) {
                        const headers = typeof options.headers === "function" ? options.headers() : {};
                        for (const header in headers) {
                            proxyReq.setHeader(header, headers[header]);
                        }
                    }
                },
                proxyRes: (proxyRes, req) => {
                    console.log(`Proxied request to: ${target}${req.url}`);
                }
            }
        });
    }
}
