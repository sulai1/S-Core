import { type Middleware, Fetcher } from "openapi-typescript-fetch";
import type { Token, TokenStore } from "../store/TokenStore";
import type { paths } from "@s-core/nginx-proxy-manager";

export class NginxProxyManagerService {
    private fetcher = Fetcher.for<paths>();
    private fetchToken = this.fetcher
        .path("/tokens")
        .method("post")
        .create();
    proxies = this.fetcher
        .path("/nginx/proxy-hosts")
        .method("get")
        .create();

    private readonly TOKEN_ID = "npm";

    constructor(
        private store: TokenStore,
        readonly baseUrl: string,
        private identity: string,
        private secret: string
    ) {
        this.fetcher.configure({
            baseUrl,
            use: [this.addTokenHeader]
        });
        this.store.addToken(this.TOKEN_ID, this.refresh);
    };

    refresh: () => Promise<Token> = async () => {
        try {
            const res = await this.fetchToken({
                identity: this.identity,
                secret: this.secret
            });
            if (!res.ok) {
                throw new Error(`Failed to fetch token: ${res.status}`);
            } if (!("expires" in res.data)) {
                throw new Error("2FA required");
            }
            return res.data;
        } catch (error) {
            await this.store.removeToken(this.TOKEN_ID);
            throw error;
        }
    };
    getTokenHeaders: () => Promise<string[]> = async () => {
        if (this.store.hasToken(this.TOKEN_ID)) {
            const tokenresponse = this.store.getToken(this.TOKEN_ID);
            if (!tokenresponse) {
                await this.store.removeToken(this.TOKEN_ID);
                throw new Error("Failed to obtain token");
            }
            return [`Authorization: Bearer ${tokenresponse.token}`];
        } else {
            throw new Error("Token not found in store");
        }
    };
    addTokenHeader: Middleware = async (url, init, next) => {
        if (url.endsWith("/tokens")) {
            return next(url, init);
        }
        if (this.store.hasToken(this.TOKEN_ID)) {
            const tokenresponse = this.store.getToken(this.TOKEN_ID);
            if (!tokenresponse) {
                await this.store.removeToken(this.TOKEN_ID);
                throw new Error("Failed to obtain token");
            }
            init.headers.append("Authorization", `Bearer ${tokenresponse.token}`);
            const response = await next(url, init);
            return response;
        } else {
            await this.store.removeToken(this.TOKEN_ID);
            throw new Error("Token not found in store");
        }
    };
}
