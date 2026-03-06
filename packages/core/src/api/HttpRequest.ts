import { ContentType } from "./ContentType.js";

/**
 * options for an HTTP request
 */
export type HttpRequestOptions = {
    withCredentials?: boolean;
    headers?: { [key: string]: string | string[] | undefined; };
    timeout?: number;
    contentType?: ContentType;
    responseType?: 'json' | 'text' | 'blob' | 'arraybuffer' | 'formdata' | 'stream';
}

/**
 * A type representing an HTTP request.
 * 
 * @template Params - The type of the path parameters.
 * @template Body - The type of the request body.
 * @template Query - The type of the query parameters.
 */
export type HttpRequest<
    Params extends Record<string, string | string[] | number | undefined> = Record<string, string | string[] | number | undefined>,
    Body = unknown,
    Query = unknown
> = {
    params?: Params;
    body: Body extends undefined ? never : Body;
    query?: Query;
    url: string;
    method: string;
} & HttpRequestOptions;
