import { Request, RequestHandler, Response } from "express";
import { createRemoteJWKSet, jwtVerify, JWTPayload } from "jose";
import { DataSource, Repository } from "typeorm";
import { User, UserEntity } from "../database/entities/user.entity.js";

export type AuthContext = {
    mode: "development-bypass" | "production-jwt";
    userId: string;
    keycloakSub: string;
    groups: string[];
};

declare global {
    namespace Express {
        interface Request {
            authContext?: AuthContext;
        }
    }
}

let hasLoggedDevBypass = false;

function isProductionEnv(): boolean {
    return (process.env.NODE_ENV ?? "development").toLowerCase() === "production";
}

function readBearerToken(req: Request): string | null {
    const authorization = req.header("authorization") ?? "";
    const [scheme, token] = authorization.split(" ");
    if ((scheme ?? "").toLowerCase() !== "bearer" || !token) {
        return null;
    }
    return token.trim() || null;
}

function readStringArrayClaim(payload: JWTPayload, claimName: string): string[] {
    const claim = payload[claimName];
    if (!Array.isArray(claim)) {
        return [];
    }
    return claim.filter((value): value is string => typeof value === "string").map((value) => value.trim()).filter(Boolean);
}

function resolveUserSub(payload: JWTPayload): string | null {
    const sub = payload.sub;
    if (typeof sub !== "string" || sub.trim().length === 0) {
        return null;
    }
    return sub.trim();
}

function unauthorized(res: Response, details: string): void {
    res.status(401).json({
        error: "Unauthorized",
        details,
    });
}

export function createAuthMiddleware(dataSource: DataSource): RequestHandler {
    const userRepo: Repository<User> = dataSource.getRepository(UserEntity);

    const jwksUri = (process.env.KEYCLOAK_JWKS_URI ?? "").trim();
    const issuer = (process.env.KEYCLOAK_ISSUER ?? "").trim();
    const audience = (process.env.KEYCLOAK_AUDIENCE ?? "").trim();

    const keyResolver = jwksUri.length > 0 ? createRemoteJWKSet(new URL(jwksUri)) : null;

    return async (req, res, next) => {
        if (req.path === "/health") {
            next();
            return;
        }

        if (!isProductionEnv()) {
            const keycloakSub = (process.env.AUDIOGRABBER_DEV_USER_SUB ?? "dev-user").trim() || "dev-user";
            let user = await userRepo.findOneBy({ keycloakSub });
            if (!user) {
                user = userRepo.create({
                    keycloakSub,
                    youtubeApiKey: null,
                });
                user = await userRepo.save(user);
            }

            req.authContext = {
                mode: "development-bypass",
                userId: user.id,
                keycloakSub: user.keycloakSub,
                groups: ["dev"],
            };

            if (!hasLoggedDevBypass) {
                hasLoggedDevBypass = true;
                console.warn("[AudioGrabber] Auth bypass enabled (NODE_ENV is not production).");
            }

            next();
            return;
        }

        if (!keyResolver || issuer.length === 0) {
            unauthorized(res, "Server auth is not configured. Set KEYCLOAK_JWKS_URI and KEYCLOAK_ISSUER.");
            return;
        }

        const token = readBearerToken(req);
        if (!token) {
            unauthorized(res, "Missing Bearer token.");
            return;
        }

        try {
            const verifyOptions = audience.length > 0
                ? { issuer, audience }
                : { issuer };

            const { payload } = await jwtVerify(token, keyResolver, verifyOptions);
            const keycloakSub = resolveUserSub(payload);
            if (!keycloakSub) {
                unauthorized(res, "Token is missing sub claim.");
                return;
            }

            const groups = readStringArrayClaim(payload, "groups");

            let user = await userRepo.findOneBy({ keycloakSub });
            if (!user) {
                user = userRepo.create({
                    keycloakSub,
                    youtubeApiKey: null,
                });
                user = await userRepo.save(user);
            }

            req.authContext = {
                mode: "production-jwt",
                userId: user.id,
                keycloakSub: user.keycloakSub,
                groups,
            };

            next();
        } catch (error) {
            const details = error instanceof Error ? error.message : "JWT verification failed";
            unauthorized(res, details);
        }
    };
}
