import { defineBoot } from '#q-app/wrappers';
import { createDatasourceClient, selectFunctionDefinitions, type Client, type DataSource, type SelectFunctionDefinitions } from "s-core-client";
import type { tables } from '../../../api/src/models';
import axios from 'axios';

export let datasource: DataSource<typeof tables, SelectFunctionDefinitions>;

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
});

export default defineBoot(({ app }) => {
  // Lazy-load s-core only after boot to avoid server-side code in browser

  datasource = createDatasourceClient(baseUrl + "/data", {
    functionDefinitions: selectFunctionDefinitions
  });
  app.provide('datasource', datasource);
});
