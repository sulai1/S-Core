import { HttpRequest, HttpResponse } from "../index.js";

type ParamType = Record<string, string | number | undefined>;
type LReq<Req extends HttpRequest> = Omit<Req, 'url' | 'method' | 'body'>;

export type Client = {

    head<R, Params extends ParamType, Query>(
        url: string,
        options?: LReq<HttpRequest<Params, never, Query>>
    ): Promise<HttpResponse<R>>;

    get<R, Params extends ParamType, Query>(
        url: string,
        options?: LReq<HttpRequest<Params, never, Query>>
    ): Promise<HttpResponse<R>>;

    post<T, R, Params extends ParamType, Query>(
        url: string,
        data?: T,
        options?: LReq<HttpRequest<Params, T, Query>>
    ): Promise<HttpResponse<R>>;

    delete<T, R, Params extends ParamType, Query>(
        url: string,
        options?: LReq<HttpRequest<Params, T, Query>>
    ): Promise<HttpResponse<R>>;

    put<T, R, Params extends ParamType, Query>(
        url: string,
        data?: T,
        options?: LReq<HttpRequest<Params, T, Query>>
    ): Promise<HttpResponse<R>>;

    patch<T, R, Params extends ParamType, Query>(
        url: string,
        data?: T,
        options?: LReq<HttpRequest<Params, T, Query>>
    ): Promise<HttpResponse<R>>;
}

