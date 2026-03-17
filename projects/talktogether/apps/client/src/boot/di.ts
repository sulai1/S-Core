import { defineBoot } from '#q-app/wrappers';
import type { Client, OpenApiModule } from "@s-core/client";
import { createDatasourceClient, createFileClient, createOpenApiClient } from "@s-core/client";
import type { paths } from '@s-core/talktogether/src';
import { type tables } from '@s-core/talktogether/src/models';
import { apiSchema } from '@s-core/talktogether/src/schema';
import axios from 'axios';
import { Buffer } from 'buffer';

// Polyfill Buffer for browser
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
}

export let datasource: ReturnType<typeof createDatasourceClient<typeof tables>>;
export let routes: OpenApiModule<paths>;
export let uploads: ReturnType<typeof createFileClient>;

// Read API base URL from window config (injected by Docker/nginx) or fallback to default
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const windowConfig = window as unknown as Record<string, string | undefined>;
    if (windowConfig.API_BASE_URL) {
      return windowConfig.API_BASE_URL;
    }
  }
  const viteApiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (viteApiBaseUrl && viteApiBaseUrl.length > 0) {
    return viteApiBaseUrl;
  }

  // Last-resort fallback for local development only.
  return "http://localhost:3000";
};

export const baseUrl = getBaseUrl();

export const api = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export default defineBoot(async ({ app }) => {
  routes = await createOpenApiClient<paths>(baseUrl, apiSchema, { client: api as unknown as Client });
  datasource = createDatasourceClient(baseUrl + "/data");
  uploads = createFileClient(baseUrl, { basePath: "/images", client: api as unknown as Client });

  app.provide('datasource', datasource);
});
