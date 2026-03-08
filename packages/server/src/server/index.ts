import { NextFunction, Request, Response } from 'express';
import { ApiError, HttpRequest, HttpResponseBuilder } from '@s-core/core';
import { ExpressServer } from './ExpressServer.js';
import { Router } from './Router.js';

export * from './createDatasourceServer.js';
export * from './createFileServerModule.js';
export * from './OpenApiBuilder.js';

export const contentType = 'Content-Type';
export const defaultContentType = 'application/json';
export const contentDisposition = 'Content-Disposition';
export const attachmentPdf = 'attachment; filename="file.pdf"';

export type Handler<
    Req extends HttpRequest = HttpRequest,
    Res extends HttpResponseBuilder = HttpResponseBuilder,
> = (
    req: Req,
    res: Res,
    next: NextFunction
) => Promise<void>

export type Server<
    Req extends HttpRequest = HttpRequest,
    Res extends HttpResponseBuilder = HttpResponseBuilder,
> = Router<Req, Res> & {
    listen(port: number): Promise<Server<Req, Res>>;
    useErrorHandler<TReq extends Req = Req, TRes extends Res = Res>(
        handler: (err: any, req: TReq, res: TRes, next: () => void) => void
    ): Server<Req, Res>;
};

export function createServer<
    Req extends Request,
    Res extends Response
>(): Server<Req, Res> {
    return new ExpressServer<Req, Res>();
}