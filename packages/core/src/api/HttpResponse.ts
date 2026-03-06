/**
 * A type representing an HTTP response.
 */
export type HttpResponse<T = unknown> = {
    data?: T;
    status: number;
    statusText?: string;
};

/**
 * A builder pattern for constructing HTTP responses used by server-side middleware.
 */
export type HttpResponseBuilder<T = unknown> = {
    status: (code: number) => HttpResponseBuilder<T>;
    send: (body?: T) => HttpResponseBuilder<T>;
    pipe: (content: NodeJS.WritableStream) => NodeJS.WritableStream;
    end: (args: unknown) => HttpResponseBuilder<T>;
};