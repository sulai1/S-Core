export interface paths {
    "/loki/api/v1/query_range": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Query log range
         * @description /loki/api/v1/query_range is used to perform a LogQL query over a range of time. It
         *     supports both metric (matrix) and log (streams) query types. Parquet responses can
         *     be requested with the `Accept: application/vnd.apache.parquet` header.
         *
         *     Step versus interval:
         *     - Use `step` for metric (matrix) queries. It behaves like Prometheus `step`.
         *     - Use `interval` for log (stream) queries to return entries at or after each interval.
         */
        get: {
            parameters: {
                query: {
                    /** @description The LogQL query to perform. */
                    query: string;
                    /** @description Max number of entries to return (applies to stream responses). Defaults to 100. */
                    limit?: number;
                    /** @description The start time for the query as a nanosecond Unix epoch or other supported format. Defaults to one hour ago. */
                    start?: number | string;
                    /** @description The end time for the query as a nanosecond Unix epoch or other supported format. Defaults to now. */
                    end?: number | string;
                    /** @description A duration used to calculate `start` relative to `end`. Ignored if `start` is provided. */
                    since?: string;
                    /** @description Query resolution step width for matrix queries. Duration format (e.g. 5m) or float seconds. */
                    step?: string;
                    /** @description Interval for stream queries. Duration format or float seconds. */
                    interval?: string;
                    /** @description Sort order for logs: `forward` (oldest first) or `backward` (newest first). Defaults to `backward`. */
                    direction?: "forward" | "backward";
                };
                header?: {
                    /** @description Use `application/vnd.apache.parquet` to request Parquet-encoded responses. */
                    Accept?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description successful response (JSON or Parquet when requested) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["QueryRangeResponse"];
                        /** @description Parquet-encoded result (columns depend on resultType). */
                        "application/vnd.apache.parquet": string;
                    };
                };
                /** @description bad request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["LokiError"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/loki/api/v1/query": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Instant query (single point in time)
         * @description /loki/api/v1/query performs an instant (point-in-time) LogQL query. This endpoint
         *     is intended for metric type LogQL queries (returns `vector`) or for streams of log
         *     lines (returns `streams`). Log type queries that are not metric queries return 400.
         *     In microservices mode this endpoint is exposed by the querier and the query frontend.
         */
        get: {
            parameters: {
                query: {
                    /** @description The LogQL query to perform. */
                    query: string;
                    /** @description Max number of entries to return (applies to stream responses). Defaults to 100. */
                    limit?: number;
                    /** @description Evaluation time as a nanosecond Unix epoch or another supported time format. Defaults to now. */
                    time?: number | string;
                    /** @description Sort order of logs. `backward` (newest first) or `forward` (oldest first). Defaults to `backward`. */
                    direction?: "backward" | "forward";
                };
                header?: {
                    /** @description (optional) Tenant id(s) to query when multi-tenancy is enabled. Multiple tenants may be separated by `|`. */
                    "X-Scope-OrgID"?: string;
                    /** @description Use `application/vnd.apache.parquet` to request Parquet-encoded responses. */
                    Accept?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description successful response (JSON or Parquet when Accept header requests it) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["InstantQueryResponse"];
                        /** @description Parquet-encoded result (columns depend on resultType). See schema notes in component descriptions. */
                        "application/vnd.apache.parquet": string;
                    };
                };
                /** @description bad request (e.g., invalid LogQL or log-type query provided to instant endpoint) */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["LokiError"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/loki/api/v1/labels": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List label names
         * @description /loki/api/v1/labels retrieves the list of known labels within a given time span.
         *     Loki may use a larger time span than the one specified.
         */
        get: {
            parameters: {
                query?: {
                    /** @description start time as nanosecond Unix epoch. Defaults to 6 hours ago. */
                    start?: number;
                    /** @description end time as nanosecond Unix epoch. Defaults to now. */
                    end?: number;
                    /** @description duration used to calculate start relative to end (ignored if start is provided) */
                    since?: string;
                    /** @description Log stream selector to filter streams when determining labels, e.g. {app="myapp"} */
                    query?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["LabelListResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/loki/api/v1/label/{name}/values": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List label values
         * @description /loki/api/v1/label/{name}/values retrieves the list of known values for a given label within a given time span.
         *     Loki may use a larger time span than the one specified.
         */
        get: {
            parameters: {
                query?: {
                    /** @description start time as nanosecond Unix epoch. Defaults to 6 hours ago. */
                    start?: number;
                    /** @description end time as nanosecond Unix epoch. Defaults to now. */
                    end?: number;
                    /** @description duration used to calculate start relative to end (ignored if start is provided) */
                    since?: string;
                    /** @description Log stream selector to filter streams when determining label values, e.g. {app="myapp"} */
                    query?: string;
                };
                header?: never;
                path: {
                    /** @description The label name to query values for */
                    name: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["LabelValuesResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/loki/api/v1/status/buildinfo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Show build information
         * @description Exposes build information for the Loki binary.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Build information */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BuildInfo"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ready": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Readiness probe
         * @description /ready returns HTTP 200 when the instance is ready to accept traffic.
         *     In Kubernetes, this endpoint can be used as a readiness probe. In microservices
         *     mode the endpoint is exposed by all components.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK - ready to accept traffic */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/loki/api/v1/series": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Return series matching label matchers */
        get: {
            parameters: {
                query: {
                    /** @description Label matcher, e.g. {job="varlogs"} */
                    match: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["LabelSet"][];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/services": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List running services
         * @description /services returns a list of all running services and their current states.
         *     Possible states are: New, Starting, Running, Stopping, Terminated, Failed.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description successful response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ServicesResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        LokiError: {
            /** @description Error message */
            error?: string;
        };
        /** @description Map of labels to values */
        LabelSet: {
            [key: string]: string;
        };
        /** @description [<timestamp_nanoseconds>, "<line>"] */
        Sample: (number | string)[];
        LogStream: {
            stream?: components["schemas"]["LabelSet"];
            values?: components["schemas"]["Sample"][];
        };
        QueryRangeRequest: {
            query?: string;
            /** @description epoch nanoseconds */
            start?: number;
            /** @description epoch nanoseconds */
            end?: number;
            /** @description step (e.g. 1s) */
            step?: string;
        };
        QueryRangeResponse: {
            status?: string;
            data?: {
                resultType?: string;
                result?: components["schemas"]["LogStream"][];
            };
        };
        InstantQueryRequest: {
            query?: string;
            time?: number;
        };
        InstantQueryResponse: {
            status?: string;
            data?: {
                resultType?: string;
                result?: components["schemas"]["LogStream"][];
            };
        };
        /** @description Response wrapper for list of label names */
        LabelListResponse: {
            status?: string;
            data?: string[];
        };
        /** @description Response wrapper for list of label values for a given label */
        LabelValuesResponse: {
            status?: string;
            data?: string[];
        };
        /** @description Build information exposed by Loki (version, revision, branch, etc.) */
        BuildInfo: {
            version?: string;
            revision?: string;
            branch?: string;
            buildDate?: string;
            buildUser?: string;
            goVersion?: string;
        };
        /** @description Service status object */
        Service: {
            name: string;
            /** @enum {string} */
            state: "New" | "Starting" | "Running" | "Stopping" | "Terminated" | "Failed";
            description?: string;
        };
        /** @description Response wrapper for list of services and their states. `data` may be an array of `Service` objects or a newline-separated string (legacy format). */
        ServicesResponse: {
            status?: string;
            data?: components["schemas"]["Service"][] | string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
