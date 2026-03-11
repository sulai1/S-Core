import { Fetcher } from 'openapi-typescript-fetch';
import type { paths } from '@s-core/loki';

const npm = Fetcher.for<paths>();
npm.configure({
  baseUrl: 'http://localhost:3000',
});

const ready = npm.path("/ready").method("get").create();
const buildInfo = npm.path("/loki/api/v1/status/buildinfo").method("get").create();
const labels = npm.path("/loki/api/v1/labels").method("get").create();
const labelValues = npm.path("/loki/api/v1/label/{name}/values").method("get").create();
const query = npm.path("/loki/api/v1/query").method("get").create();
const queryRange = npm.path("/loki/api/v1/query_range").method("get").create();

export const useNpmApi = () => {
  return {
    ready,
    buildInfo,
    labels,
    labelValues,
    query,
    queryRange,
  };
};
export default useNpmApi;

export { paths };
