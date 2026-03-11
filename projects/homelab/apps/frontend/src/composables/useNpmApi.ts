import { Fetcher } from 'openapi-typescript-fetch';
import type { paths } from '@s-core/nginx-proxy-manager';


const npm = Fetcher.for<paths>();
npm.configure({
  baseUrl: 'http://localhost:3000/proxy-manager',
});

const getProxyHosts = npm.path("/nginx/proxy-hosts").method("get").create();
const getVersionCheck = npm.path("/version/check").method("get").create();
const getAccessList = npm.path("/nginx/access-lists").method("get").create()
const getCertificates = npm.path("/nginx/certificates").method("get").create()
const getUser = npm.path("/users").method("get").create();
const postUser = npm.path("/users/{userID}").method("post").create();
export const useNpmApi = () => {
  return {
    getProxyHosts,
    getVersionCheck,
    getAccessList,
    getCertificates,
    getUser,
    postUser,
  };
};
export default useNpmApi;

export { paths };
