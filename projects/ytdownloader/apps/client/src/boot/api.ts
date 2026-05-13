import { defineBoot } from '#q-app/wrappers';
import { createOpenApiClient, type Client } from '@s-core/client';
import type { OpenApiModule } from '@s-core/core';
import axios from 'axios';
import { Buffer } from 'buffer';
import type { paths } from '../../../AudioGrabber/src/server/api/index.js';
import { apiSchema } from 'src/api/schema';

if (typeof window !== 'undefined') {
    const browserWindow = window as unknown as { Buffer?: typeof Buffer };
    browserWindow.Buffer = browserWindow.Buffer ?? Buffer;
}

const API_BASE_URL_KEY = 'audiograbber.api.baseUrl';

const resolveBaseUrl = (): string => {
    if (typeof window !== 'undefined') {
        const fromStorage = window.localStorage.getItem(API_BASE_URL_KEY);
        if (fromStorage && fromStorage.length > 0) {
            // Migrate legacy dev URL to proxied same-origin path to avoid CORS.
            if (
                (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                && fromStorage === 'http://localhost:3800/api'
            ) {
                return '/api';
            }
            return fromStorage;
        }

        const windowConfig = window as unknown as Record<string, string | undefined>;
        if (windowConfig.API_BASE_URL) {
            return windowConfig.API_BASE_URL;
        }
    }

    const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
    if (fromEnv && fromEnv.length > 0) {
        return fromEnv;
    }

    return '/api';
};

export let baseUrl = resolveBaseUrl();
export let apiRoutes: OpenApiModule<paths>;

const api = axios.create({
    baseURL: baseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const apiClient = api;

export const setApiBaseUrl = async (url: string): Promise<void> => {
    baseUrl = url;
    api.defaults.baseURL = url;
    if (typeof window !== 'undefined') {
        window.localStorage.setItem(API_BASE_URL_KEY, url);
    }
    apiRoutes = await createOpenApiClient<paths>(url, apiSchema, { client: api as unknown as Client });
};

export default defineBoot(async ({ app }) => {
    apiRoutes = await createOpenApiClient<paths>(baseUrl, apiSchema, { client: api as unknown as Client });
    app.provide('apiRoutes', apiRoutes);
});
