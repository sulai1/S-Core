import express, { Application, Request, Response } from 'express';
import { ExpressRouter } from '.';
import { Server } from '.';

/**
 * Express server implementation.
 * @extends ExpressRouter
 * @implements Server
 * 
 * @template Req - The type of the HTTP request, extending Express Request.
 * @template Res - The type of the HTTP response, extending Express Response.
 */
export class ExpressServer<
    Req extends Request = Request,
    Res extends Response = Response,
> extends ExpressRouter<Req, Res> implements Server<Req, Res> {
    constructor(readonly app: Application = express()) {
        super(app);
    }

    /**
     * Listen on the specified port. 
     * @param port the port number to listen on
     * @returns a promise that resolves to the server instance
     */
    async listen(port: number): Promise<Server<Req, Res>> {
        // Register global error handler using the explicit error handler method
        this.useErrorHandler((err: Error, req: Request, res: Response, next: () => void) => {
            console.error('Unhandled error:', err);
            res.status(500).json({
                status: 500,
                error: err.name || 'Internal Server Error',
                message: err.message,
                ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
            });
        });

        const promis = new Promise<Server<Req, Res>>((resolve) => {
            this.app.listen(port, () => {
                console.info(`Server is listening on http://localhost:${port}`);
                resolve(this);
            });
        });
        return await promis;
    }

}