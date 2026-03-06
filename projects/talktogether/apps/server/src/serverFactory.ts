import { apiSchema, paths, tables } from "api";
import cors from 'cors';
import express from 'express';
import session, { SessionData } from 'express-session';
import bcrypt from 'bcrypt';
import { PassThrough } from "node:stream";
import { Application, createDatasourceSchema, createDatasourceServer, createFileSchema, createFileServerModule, createServer, DataSource, FilePaths, SelectFunctionDefinitions } from "s-core";
import { imgPath } from "../app";
import { createIdentification } from "./pdf";

const env = process.env.NODE_ENV || 'development';


export async function serverFactory(
    provider: Application<{ db: () => DataSource<typeof tables, SelectFunctionDefinitions> }>,
    options?: { port?: number }
) {
    const server = createServer();
    // Configure CORS to allow frontend access
    server.use(cors({
        origin: [
            /^http:\/\/localhost(:\d+)?$/,
            /^http:\/\/127\.0\.0\.1(:\d+)?$/,
            'http://localhost',
            'http://127.0.0.1'
        ],
        credentials: true
    }));

    // Session middleware
    const sessionMiddleware = session({
        secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: env === 'production',
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 // 24 hours
        }
    });


    // Parse JSON request bodies
    server.use(express.json());

    // Log requests
    if (env !== 'production') {
        server.use((req: any, res: any, next: any) => { console.log("Request: ", req.url, req.method, req.headers, req.body); next(); });
    }
    const db = await provider.getModule("db");
    server.extend("/", async (req, res) => {
        sessionMiddleware(req, res, () => { })
        return { session: req.session as SessionData & { userId?: number; userEmail?: string } };
    }).add<paths>("/", apiSchema, {
        "/auth/login": {
            post: async (req: { email: string; password: string }, options: express.Request) => {
                try {
                    const { email, password } = req;
                    if (!email || !password) {
                        throw new Error('Email and password are required');
                    }

                    const users = await db.find('User', {
                        attributes: {
                            email: "email",
                            id: "id",
                            firstName: "firstName",
                            lastName: "lastName",
                            password: "password"
                        },
                        where: [{ function: '=', params: ["email", { value: email }] }],
                        limit: 1
                    });

                    if (!users || users.length === 0) {
                        throw new Error('Invalid credentials');
                    }

                    const user = users[0];
                    const passwordMatch = await bcrypt.compare(password, user.password);

                    if (!passwordMatch) {
                        throw new Error('Invalid credentials');
                    }

                    (options.session as SessionData & { userId?: number; userEmail?: string }).userId = user.id;
                    (options.session as SessionData & { userId?: number; userEmail?: string }).userEmail = user.email;


                    return {
                        success: true,
                        user: {
                            id: user.id,
                            email: user.email,
                            firstName: user.firstName,
                            lastName: user.lastName
                        }
                    };
                } catch (error) {
                    throw new Error(error instanceof Error ? error.message : 'Login failed');
                }
            },
        },
        "/auth/logout": {
            post: async (req: any, res: any) => {
                req.session.destroy((err: any) => {
                    if (err) {
                        res.status(500).json({ error: 'Logout failed' });
                        return;
                    }
                    res.json({ success: true });
                });
            },
        },
        "/auth/session": {
            get: async (req: any, res: any) => {
                if (req.session.userId) {
                    res.json({
                        authenticated: true,
                        user: {
                            id: req.session.userId,
                            email: req.session.userEmail
                        }
                    });
                } else {
                    res.json({ authenticated: false });
                }
            },
        },
        "/createIdentification": {
            post: async (req: { id: number }[]) => {
                const s = new PassThrough();
                const salesman = await db.find("Salesman", {
                    where: [{ function: "in", params: ["id", { value: req.map(v => v.id) }] }]
                })
                createIdentification(salesman, s, db).catch(err => {
                    console.error("Error creating identification:", err);
                    s.destroy(err);
                });
                return s as unknown as string;
            },
        },
    })
    server.add<FilePaths<"/images">>("/", createFileSchema("/images"), createFileServerModule("/images", imgPath, {
        fileName: (file) => `${Date.now()}-${file.originalname}`
    }), { validateRequests: false, validateResponses: false });

    server.add("/data",
        createDatasourceSchema("/data", tables),
        createDatasourceServer(db)
    )
    // Error handling middleware (using explicit error handler method)
    server.useErrorHandler((err: any, req: any, res: any, next: any) => {
        const status = err.status || 500;
        const errorResponse = {
            status,
            error: err.error || err.name || "Internal Server Error",
            details: err.details || err.message,
            ...(env !== 'production' && { stack: err.stack })
        };
        console.error(`[${status}] Error:`, errorResponse);
        res.status(status).json(errorResponse);
    });

    provider.on("afterStart", async () => {
        const port = options?.port || 3000;
        await server.listen(port);
        console.log(`Server started on port ${port}`);
    });
}