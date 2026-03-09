import { PassThrough } from "node:stream";
import { Application, createDatasourceSchema, createFileSchema, DataSource, FilePaths, SelectFunctionDefinitions } from "@s-core/core";
import { createDatasourceServer, createFileServerModule, createServer } from "@s-core/server";
import { apiSchema, paths, tables } from "@s-core/talktogether";
import bcrypt from 'bcrypt';
import cors from 'cors';
import express from 'express';
import session, { Session, SessionData } from 'express-session';
import { imgPath } from "../app";
import { createIdentification } from "./pdf";

const env = process.env.NODE_ENV || 'development';
type SessionContext = Session & SessionData & { session: { userId?: number; userEmail?: string } };

const configuredCorsOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

const isCookieSecure = (process.env.COOKIE_SECURE || '').toLowerCase() === 'true';

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
    const db = provider.getModule("db");
    const server = createServer()
        .use((req, res, next) => {
            console.log(req.url);
            next()
        })
        .use(cors({
            origin: [
                /^http:\/\/localhost(:\d+)?$/,
                /^http:\/\/127\.0\.0\.1(:\d+)?$/,
                ...configuredCorsOrigins
            ],
            credentials: true
        }))
        .use(express.json());
    server.extend("/", session({
        secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: isCookieSecure,
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 // 24 hours
        }
    }), (req: unknown) => {
        if (typeof req === "object" && req !== null && "session" in req) {
            return { session: (req as { session: unknown }).session } as SessionContext;
        }
        return { session: {} } as SessionContext;
    })
        .add<paths>("/", apiSchema, {
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

                        // Explicitly save the session
                        await new Promise<void>((resolve, reject) => {
                            options.session.save((err?: Error | null) => {
                                if (err) {
                                    writeLog("ERROR", "Failed to save session:", err);
                                    reject(err);
                                    return;
                                }
                                resolve();
                            });
                        });

                        writeLog("INFO", "Login successful - Session set for user:", user.id, user.email);

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
                    writeLog("INFO", "Session check - userId:", options?.session?.userId);
                    const user = options?.session?.userId;
                    if (user) {
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
        }).add<FilePaths<"/images">>("/", createFileSchema("/images"), createFileServerModule("/images", imgPath, {
            fileName: (file) => `${Date.now()}-${getUploadOriginalName(file)}`
        }), { validateRequests: false, validateResponses: false })
        .add("/data",
            createDatasourceSchema("/data", tables),
            createDatasourceServer(db)
        );
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
    if (env !== 'production') {
        server.use((req, _res, next) => {
            writeLog("INFO", "Request:", req.method, req.url);
            next();
        });
    }
    provider.on("afterStart", async () => {
        const port = options?.port || 3000;
        await server.listen(port);
        writeLog("INFO", `Server started on port ${port}`);
    });
}