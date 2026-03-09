import { type Middleware, Fetcher } from "openapi-typescript-fetch";
import type { paths } from "@s-core/loki";

export class LokiService {
    private fetcher = Fetcher.for<paths>();
    readonly query = this.fetcher.path("/loki/api/v1/query").method("get").create();
    readonly query_range = this.fetcher.path("/loki/api/v1/query_range").method("get").create();
    readonly ready = this.fetcher.path("/ready").method("get").create();
    readonly services = this.fetcher.path("/services").method("get").create();
    readonly buildInfo = this.fetcher.path("/loki/api/v1/status/buildinfo").method("get").create();
    readonly labels = [] as string[];

    constructor(
        readonly baseUrl: string,
        private readonly identity: string,
        private readonly secret: string
    ) {
        this.fetcher.configure({ baseUrl, use: [this.addAuthHeader] });
        const labelsFetcher = this.fetcher.path("/loki/api/v1/labels").method("get").create();
        labelsFetcher({}).then((res) => {
            this.labels.push(...res.data.data ?? []);
        }).catch(() => {
            throw new Error("Failed to fetch labels from Loki instance");
        });
    };

    addAuthHeader: Middleware = async (url, init, next) => {
        if (url.endsWith("/tokens")) {
            return next(url, init);
        }
        init.headers.append(
            "Authorization",
            `Basic ${Buffer.from(`${this.identity}:${this.secret}`).toString("base64")}`);
        return next(url, init);
    };
}
