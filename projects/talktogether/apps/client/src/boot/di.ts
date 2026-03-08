import { defineBoot } from '#q-app/wrappers';
import type { OpenApiModule } from "@s-core/client";
import { createDatasourceClient, createOpenApiClient, type Client } from "@s-core/client";
import type { paths } from '@s-core/talktogether/src';
import { apiSchema } from '@s-core/talktogether/src/schema';
import { type tables } from '@s-core/talktogether/src/models';
import axios from 'axios';
import { Buffer } from 'buffer';

// Polyfill Buffer for browser
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
}

export let datasource: ReturnType<typeof createDatasourceClient<typeof tables>>;
export let routes: OpenApiModule<paths>;

// Read API base URL from window config (injected by Docker/nginx) or fallback to default
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const windowConfig = window as unknown as Record<string, string | undefined>;
    if (windowConfig.API_BASE_URL) {
      return windowConfig.API_BASE_URL;
    }
  }
  // Default to same origin (no CORS issues)
  return typeof window !== 'undefined' ? window.location.origin : "http://localhost:3000";
};

export const baseUrl = getBaseUrl();

export const api: Client = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies with cross-origin requests
});

export default defineBoot(async ({ app }) => {
  // Lazy-load s-core only after boot to avoid server-side code in browser

  routes = await createOpenApiClient<paths>(apiSchema, api)

  datasource = createDatasourceClient(baseUrl + "/data");
  app.provide('datasource', datasource);
});
