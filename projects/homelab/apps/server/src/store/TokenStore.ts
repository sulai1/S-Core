import { ApiError } from "@s-core/core";

export type Token = {
    token: string;
    expires: string;
};

export type TokenStore = {
    addToken: (
        key: string,
        refresh: () => Promise<Token>
    ) => void;

    removeToken: (
        key: string
    ) => Promise<void>;

    getToken: (
        key: string
    ) => Token | undefined;

    hasToken: (
        key: string
    ) => boolean;
};

export class InMemoryTokenStore implements TokenStore {
    private tokens: Map<string, Token> = new Map();
    private refreshers: Map<string, () => Promise<Token>> = new Map();

    addToken(
        key: string,
        refresh: () => Promise<Token>
    ): void {
        if (this.refreshers.has(key)) {
            throw new Error(`Token for key ${key} already exists`);
        }
        refresh().then(token => {
            this.tokens.set(key, token);
        }).catch(err => {
            throw new ApiError("Initial token fetch failed"+err );
        });
        this.refreshers.set(key, refresh);
    }

    async removeToken(path: string): Promise<void> {
        this.refreshers.delete(path);
        this.tokens.delete(path);
    }

    hasToken(path: string): boolean {
        return this.refreshers.has(path);
    }

    getToken(
        path: string
    ): Token | undefined {
        const token = this.tokens.get(path);
        const now = Date.now();
        if (!token || new Date(token.expires).getTime() < now ) {
            const refresher = this.refreshers.get(path);
            if (refresher) {
                refresher().then(newToken => {
                    this.tokens.set(path, newToken);
                }).catch(err => {
                    this.tokens.delete(path);
                    throw new ApiError("Token refresh failed", { cause: err });
                });
            }
        }
        return token;
    }
}
