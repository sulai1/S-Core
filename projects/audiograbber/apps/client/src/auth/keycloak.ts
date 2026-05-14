import type { RouteLocationNormalized } from 'vue-router';
import { reactive } from 'vue';
import Keycloak from 'keycloak-js';

const normalize = (value: string | undefined): string => (value ?? '').trim().toLowerCase();

const envNode = normalize(import.meta.env.VITE_NODE_ENV);
const processNode = normalize(typeof process !== 'undefined' ? process.env.NODE_ENV : undefined);
const forceAuth = normalize(import.meta.env.VITE_REQUIRE_AUTH);

const shouldRequireAuth = (): boolean => {
    if (forceAuth === 'true') {
        return true;
    }
    if (forceAuth === 'false') {
        return false;
    }
    return import.meta.env.PROD || envNode === 'production' || processNode === 'production';
};

const rawKeycloakUrl = (import.meta.env.VITE_KEYCLOAK_URL ?? '').trim();
const rawKeycloakRealm = (import.meta.env.VITE_KEYCLOAK_REALM ?? '').trim();
const keycloakClientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? '';

const resolveKeycloakConfig = (): { url: string; realm: string } => {
    const match = rawKeycloakUrl.match(/^(https?:\/\/[^/]+)\/realms\/([^/]+)\/?$/i);
    if (match && match[1] && match[2]) {
        return {
            url: match[1],
            realm: rawKeycloakRealm.length > 0 ? rawKeycloakRealm : match[2],
        };
    }

    return {
        url: rawKeycloakUrl.replace(/\/$/, ''),
        realm: rawKeycloakRealm,
    };
};

const resolvedKeycloakConfig = resolveKeycloakConfig();
const keycloakUrl = resolvedKeycloakConfig.url;
const keycloakRealm = resolvedKeycloakConfig.realm;

const hasConfig = (): boolean => keycloakUrl.length > 0 && keycloakRealm.length > 0 && keycloakClientId.length > 0;

const sanitizeRedirectPath = (redirectPath?: string): string => {
    const fallback = '/download';
    if (!redirectPath || redirectPath.trim().length === 0) {
        return fallback;
    }

    const raw = redirectPath.trim();
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
        return fallback;
    }

    const withoutHash = raw.startsWith('#') ? raw.slice(1) : raw;
    const pathOnly = withoutHash.split('?')[0]?.split('&')[0] ?? fallback;
    if (!pathOnly.startsWith('/')) {
        return fallback;
    }

    return pathOnly.length > 0 ? pathOnly : fallback;
};

const normalizeMalformedHashCallback = (): void => {
    if (typeof window === 'undefined') {
        return;
    }

    const currentHash = window.location.hash;
    if (!currentHash.startsWith('#/')) {
        return;
    }

    let nextHash = currentHash;
    // Fix malformed hash callbacks like #/download&state=... -> #/download?state=...
    nextHash = nextHash.replace(/^(#\/[^?&]+)&(state|code|session_state|iss)=/i, '$1?$2=');
    // Drop accidentally appended duplicate absolute URLs.
    nextHash = nextHash.replace(/\?https?:\/\/.*$/i, '');

    if (nextHash !== currentHash) {
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`);
    }
};

export const authState = reactive({
    required: shouldRequireAuth(),
    initialized: false,
    authenticated: false,
    username: null as string | null,
    error: null as string | null,
});

let keycloakClient: Keycloak | null = null;
let initPromise: Promise<void> | null = null;

const getClient = (): Keycloak => {
    if (keycloakClient) {
        return keycloakClient;
    }

    keycloakClient = new Keycloak({
        url: keycloakUrl,
        realm: keycloakRealm,
        clientId: keycloakClientId,
    });

    return keycloakClient;
};

const updateStateFromClient = (client: Keycloak): void => {
    authState.authenticated = Boolean(client.authenticated);
    authState.username = (client.tokenParsed?.preferred_username as string | undefined) ?? null;
};

export const initializeAuth = async (): Promise<void> => {
    if (!authState.required) {
        authState.initialized = true;
        authState.authenticated = true;
        return;
    }

    if (!hasConfig()) {
        authState.initialized = true;
        authState.error = 'Missing Keycloak config. Set VITE_KEYCLOAK_URL, VITE_KEYCLOAK_REALM, and VITE_KEYCLOAK_CLIENT_ID.';
        return;
    }

    if (initPromise) {
        await initPromise;
        return;
    }

    initPromise = (async () => {
        try {
            normalizeMalformedHashCallback();
            const client = getClient();
            await client.init({
                pkceMethod: 'S256',
                responseMode: 'query',
                checkLoginIframe: false,
            });
            updateStateFromClient(client);
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : JSON.stringify(error);
            authState.error = message;
            authState.authenticated = false;
        } finally {
            authState.initialized = true;
        }
    })();

    await initPromise;
};

export const loginWithKeycloak = async (redirectPath?: string): Promise<void> => {
    if (!authState.required) {
        return;
    }
    await initializeAuth();
    if (!hasConfig() || !keycloakClient) {
        return;
    }

    const normalizedPath = sanitizeRedirectPath(redirectPath);
    const redirectUri = `${window.location.origin}/#${normalizedPath}`;

    await keycloakClient.login({ redirectUri });
};

export const logoutWithKeycloak = async (): Promise<void> => {
    if (!authState.required || !keycloakClient) {
        return;
    }

    await keycloakClient.logout({ redirectUri: window.location.origin });
};

export const getValidAccessToken = async (): Promise<string | null> => {
    if (!authState.required) {
        return null;
    }

    await initializeAuth();
    if (!keycloakClient || !keycloakClient.authenticated) {
        return null;
    }

    try {
        await keycloakClient.updateToken(30);
        updateStateFromClient(keycloakClient);
        return keycloakClient.token ?? null;
    } catch {
        authState.authenticated = false;
        return null;
    }
};

export const handleAuthNavigation = async (
    to: RouteLocationNormalized,
): Promise<true | { path: string; query?: Record<string, string> }> => {
    if (!authState.required) {
        return true;
    }

    await initializeAuth();

    if (to.path === '/login') {
        if (authState.authenticated) {
            const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : '/download';
            return { path: redirect };
        }
        return true;
    }

    if (authState.authenticated) {
        return true;
    }

    if (authState.error) {
        return { path: '/login' };
    }

    return {
        path: '/login',
        query: {
            redirect: to.fullPath,
        },
    };
};
