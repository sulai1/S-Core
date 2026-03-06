import type { Express, Request, Response, Server } from 'express';
declare module '#q-app' {
  interface SsrDriver {
    app: Express;
    listenResult: Server;
    request: Request;
    response: Response;
  }
}

export {};