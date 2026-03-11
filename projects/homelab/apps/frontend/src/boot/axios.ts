import { defineBoot } from '#q-app/wrappers';
import axios from 'axios';

type AxiosInstance = ReturnType<typeof axios.create>;

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
    $npmApi: AxiosInstance;
  }
}

const api = axios.create({ baseURL: 'http://localhost:3000' });
const npmApi = axios.create({
  baseURL: (import.meta).env?.NPM_API_BASE_URL || 'http://localhost:3000/api',
});

export default defineBoot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios;
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api;
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
  app.config.globalProperties.$npmApi = npmApi;
});

export { api, npmApi };
