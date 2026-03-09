import type { TokenResponse } from "..";

function toUnix(expires: string | number): number {
    if (typeof expires === 'number') { return expires; };
    const d = Date.parse(expires);
    return Number.isNaN(d) ? Math.floor(Date.now() / 1000) + 3600 : Math.floor(d / 1000);
}

export class NpmAuthService {
    private token: string | null = null;
    private expires: number | null = null;

    isAuthenticated(): boolean {
        if (!this.token || !this.expires) { return false; }
        const now = Math.floor(Date.now() / 1000);
        return now < this.expires;
    }

    setToken(resp: TokenResponse) {
        this.token = resp.token;
        this.expires = toUnix(resp.expires);
    }

    clear() {
        this.token = null;
        this.expires = null;
    }

    getToken(): string | null {
        return this.token;
    }

    getExpires(): number | null {
        return this.expires;
    }
}
