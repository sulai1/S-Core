import { DataSource } from "../../../module/index.js";

export type DataSourcePaths<T extends DataSource<any, any>> = {
    "/get": Get<T>;
    "/insert": Insert<T>;
    "/update": Update<T>;
    "/delete": Delete<T>;
    "/find": Find<T>;
    "/select": Select<T>;
};

export type Get<T extends DataSource> = {
    post: {
        requestBody: {
            content: {
                "application/json": {
                    table: Parameters<T["get"]>[0], key: Parameters<T["get"]>[1]
                };
            },
        },
        responses: {
            /** @description The requested record */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": ReturnType<T["get"]>;
                };
            };
        };
    };
}

export type Insert<T extends DataSource> = {
    post: {
        requestBody: {
            content: {
                "application/json": {
                    table: Parameters<T["insert"]>[0],
                    data: Parameters<T["insert"]>[1]
                };
            };
        };
        responses: {
            /** @description Created records */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Awaited<ReturnType<T["insert"]>>;
                };
            };
        };
    };
}

export type Update<T extends DataSource> = {
    post: {
        requestBody: {
            content: {
                "application/json": {
                    table: Parameters<T["update"]>[0],
                    data: Parameters<T["update"]>[1],
                    where: Parameters<T["update"]>[2],
                }
            };
        };
        responses: {
            /** @description Found records */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Awaited<ReturnType<T["update"]>>;
                };
            };
        };
    };
}

export type Delete<T extends DataSource> = {
    post: {
        requestBody: {
            content: {
                "application/json": {
                    table: Parameters<T["delete"]>[0],
                    where: Parameters<T["delete"]>[1]
                };
            };
        };
        responses: {
            /** @description Deleted records */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Awaited<ReturnType<T["delete"]>>;
                };
            };
        };
    };
}

export type Find<T extends DataSource> = {
    post: {
        requestBody: {
            content: {
                "application/json": {
                    table: Parameters<T["find"]>[0],
                    query: Parameters<T["find"]>[1]
                };
            };
        };
        responses: {
            /** @description Found records */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Awaited<ReturnType<T["find"]>>;
                }
            }
        }
    }
}

export type Select<T extends DataSource> = {
    post: {
        requestBody: {
            content: {
                "application/json": {
                    tables: Parameters<T["select"]>[0],
                    query: Parameters<T["select"]>[1]
                }
            }
        },
        responses: {
            /** @description Found records */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Awaited<ReturnType<T["select"]>>;
                }
            }
        }
    }
}