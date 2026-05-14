declare namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV: string;
        VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
        VUE_ROUTER_BASE: string | undefined;
    }
}

interface ImportMetaEnv {
    readonly VITE_NODE_ENV?: string;
    readonly VITE_REQUIRE_AUTH?: string;
    readonly VITE_KEYCLOAK_URL?: string;
    readonly VITE_KEYCLOAK_REALM?: string;
    readonly VITE_KEYCLOAK_CLIENT_ID?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
