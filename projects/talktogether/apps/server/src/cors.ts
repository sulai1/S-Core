
import { Application, Logger } from '@s-core/core';
import cors from 'cors';
import fs from 'fs';

const loadCorsOrigins = (logger: Logger) => {
    const corsConfigPath = '/app/data/corsAllowedOrigins.json';
    const defaultOrigins = (process.env.CORS_ORIGINS || '')
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0);
    
    try {
        if (fs.existsSync(corsConfigPath)) {
            const fileContent = fs.readFileSync(corsConfigPath, 'utf-8');
            const parsed = JSON.parse(fileContent) as { origins?: string[] };
            if (Array.isArray(parsed.origins)) {
                logger.info( `Loaded CORS origins from ${corsConfigPath}: ${parsed.origins.length} entries`);
                return parsed.origins;
            }
        }
    } catch (err) {
        logger.error(`Failed to load CORS config from ${corsConfigPath}:`, err);
    }
    
    logger.info(`Using default CORS origins from CORS_ORIGINS env var`);
    return defaultOrigins;
};


export function createCors(
    provider: Application<{ logger: () => Logger }> 
){
    const configuredCorsOrigins = loadCorsOrigins(provider.getModule("logger"));
    const corsMiddleware = cors({
            origin: [
                /^http:\/\/localhost(:\d+)?$/,
                /^http:\/\/127\.0\.0\.1(:\d+)?$/,
                /^http:\/\/100\.71\.92\.82(:\d+)?$/,
                /^https:\/\/talktogether\.sascha-wernegger\.me(:\d+)?$/,
                ...configuredCorsOrigins
            ],
            credentials: true
        })
    return corsMiddleware;
}
