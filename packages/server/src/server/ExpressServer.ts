import express, { Application, Request, Response } from 'express';
import { Server as HttpServer } from 'node:http';
import { ExpressRouter } from './ExpressRouter.js';
import { Server } from './index.js';

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
    private nodeServer?: HttpServer;

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

        await this.waitForPendingRouteRegistrations();

        return new Promise<Server<Req, Res>>((resolve, reject) => {
            const server = this.app.listen(port, () => {
                this.nodeServer = server;
                // Explicitly ref the HTTP listener so it keeps the event loop alive.
                server.ref();
                console.info(`Server is listening on http://localhost:${port}`);
                resolve(this);
            });

            server.on('close', () => {
                console.warn(`HTTP server on port ${port} was closed.`);
            });

            server.on('error', (err: Error & { code?: string }) => {
                if (err.code === 'EADDRINUSE') {
                    reject(new Error(`Port ${port} is already in use. Please stop the existing server or use a different port.`));
                } else {
                    reject(err);
                }
            });
        });
    }

}