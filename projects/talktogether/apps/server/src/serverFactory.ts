import { PassThrough } from "node:stream";
import { apiSchema, paths, tables } from "@s-core/talktogether";
import cors from 'cors';
import express from 'express';
import session, { Session, SessionData } from 'express-session';
import bcrypt from 'bcrypt';
import { Application, createDatasourceSchema, createFileSchema, DataSource, FilePaths, SelectFunctionDefinitions } from "@s-core/core";
import { createDatasourceServer, createFileServerModule, createServer } from "@s-core/server";
import { imgPath } from "../app";
import { createIdentification } from "./pdf";

const env = process.env.NODE_ENV || 'development';
type SessionContext = Session & SessionData & { userId?: number; userEmail?: string };

const writeLog = (level: "INFO" | "ERROR", ...parts: unknown[]) => {
    const message = parts.map((part) => {
        if (typeof part === "string") {
            return part;
        }
        try {
            return JSON.stringify(part);
        } catch {
            return String(part);
        }
    }).join(" ");
    const line = `[${level}] ${message}\n`;
    if (level === "ERROR") {
        process.stderr.write(line);
        return;
    }
    process.stdout.write(line);
};

const getUploadOriginalName = (file: unknown) => {
    if (typeof file === "object" && file !== null && "originalname" in file) {
        const maybeName = (file as { originalname?: unknown }).originalname;
        if (typeof maybeName === "string" && maybeName.length > 0) {
            return maybeName;
        }
    }
    return "upload";
};


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

    // Log requests in development without relying on console.
    if (env !== 'production') {
        server.use((req, _res, next) => {
            writeLog("INFO", "Request:", req.method, req.url);
            next();
        });
    }
    const db = provider.getModule("db");
    await server.extend("/", async (req, res) => {
        sessionMiddleware(req, res, () => { })
        return { session: req.session as SessionContext };
    }).add<paths>("/", apiSchema, {
        "/auth/login": {
            post: async (req, options) => {
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

                    if (!options?.session) {
                        throw new Error('Session is not available');
                    }

                    options.session.userId = user.id;
                    options.session.userEmail = user.email;


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
            post: async (_req, options) => {
                if (!options?.session) {
                    return { success: false };
                }

                await new Promise<void>((resolve, reject) => {
                    options.session.destroy((err?: Error | null) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve();
                    });
                });

                return { success: true };
            },
        },
        "/auth/session": {
            get: async (options) => {
                if (options?.session?.userId) {
                    return {
                        authenticated: true,
                        user: {
                            id: options.session.userId,
                            email: options.session.userEmail
                        }
                    };
                }

                return { authenticated: false };
            },
        },
        "/createIdentification": {
            post: async (req) => {
                const s = new PassThrough();
                const userIds = req.map(v => Number(v.userId));
                const salesman = await db.find("Salesman", {
                    where: [{ function: "in", params: ["id", { value: userIds }] }]
                })
                createIdentification(salesman, s, db).catch(err => {
                    writeLog("ERROR", "Error creating identification:", err);
                    s.destroy(err);
                });
                return s as unknown as string;
            },
        },
    })
    await server.add<FilePaths<"/images">>("/", createFileSchema("/images"), createFileServerModule("/images", imgPath, {
        fileName: (file) => `${Date.now()}-${getUploadOriginalName(file)}`
    }), { validateRequests: false, validateResponses: false });

    await server.add("/data",
        createDatasourceSchema("/data", tables),
        createDatasourceServer(db)
    )
    // Error handling middleware (using explicit error handler method)
    server.useErrorHandler((err, req, res) => {
        const error = typeof err === 'object' && err !== null
            ? err as { status?: number; error?: string; name?: string; details?: string; message?: string; stack?: string }
            : {};
        const status = typeof error.status === 'number' ? error.status : 500;
        const errorResponse = {
            status,
            error: error.error || error.name || "Internal Server Error",
            details: error.details || error.message || 'Unexpected error',
            ...(env !== 'production' && { stack: error.stack })
        };
        writeLog("ERROR", `[${status}] Error:`, errorResponse);
        res.status(status).json(errorResponse);
    });

    provider.on("afterStart", async () => {
        const port = options?.port || 3000;
        await server.listen(port);
        writeLog("INFO", `Server started on port ${port}`);
    });
}