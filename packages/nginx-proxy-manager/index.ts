export interface paths {
    "/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Returns the API health status */
        get: operations["health"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/audit-log": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Audit Logs */
        get: operations["getAuditLogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/audit-log/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Audit Log Event */
        get: operations["getAuditLog"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/nginx/access-lists": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get all access lists */
        get: operations["getAccessLists"];
        put?: never;
        /** Create a Access List */
        post: operations["createAccessList"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/nginx/access-lists/{listID}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a access List */
        get: operations["getAccessList"];
        /** Update a Access List */
        put: operations["updateAccessList"];
        post?: never;
        /** Delete a Access List */
        delete: operations["deleteAccessList"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/nginx/certificates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get all certificates */
        get: operations["getCertificates"];
        put?: never;
        /** Create a Certificate */
        post: operations["createCertificate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/nginx/certificates/dns-providers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get DNS Providers for Certificates */
        get: operations["getDNSProviders"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/nginx/certificates/validate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Validates given Custom Certificates */
        post: operations["validateCertificates"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/nginx/certificates/test-http": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Test HTTP Reachability */
        post: operations["testHttpReach"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/nginx/certificates/{certID}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a Certificate */
        get: operations["getCertificate"];
        put?: never;
        post?: never;
        /** Delete a Certificate */
        delete: operations["deleteCertificate"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/nginx/certificates/{certID}/download": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Downloads a Certificate */
        get: operations["downloadCertificate"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/nginx/certificates/{certID}/renew": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Renews a Certificate */
        post: operations["renewCertificate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/nginx/certificates/{certID}/upload": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Uploads a custom Certificate */
        post: operations["uploadCertificate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/nginx/proxy-hosts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get all proxy hosts */
        get: operations["getProxyHosts"];
        put?: never;
        /** Create a Proxy Host */
        post: operations["createProxyHost"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/nginx/proxy-hosts/{hostID}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a Proxy Host */
        get: operations["getProxyHost"];
        /** Update a Proxy Host */
        put: operations["updateProxyHost"];
        post?: never;
        /** Delete a Proxy Host */
        delete: operations["deleteProxyHost"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/nginx/proxy-hosts/{hostID}/enable": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Enable a Proxy Host */
        post: operations["enableProxyHost"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/nginx/proxy-hosts/{hostID}/disable": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Disable a Proxy Host */
        post: operations["disableProxyHost"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/nginx/redirection-hosts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get all Redirection hosts */
        get: operations["getRedirectionHosts"];
        put?: never;
        /** Create a Redirection Host */
        post: operations["createRedirectionHost"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/nginx/redirection-hosts/{hostID}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a Redirection Host */
        get: operations["getRedirectionHost"];
        /** Update a Redirection Host */
        put: operations["updateRedirectionHost"];
        post?: never;
        /** Delete a Redirection Host */
        delete: operations["deleteRedirectionHost"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/nginx/redirection-hosts/{hostID}/enable": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Enable a Redirection Host */
        post: operations["enableRedirectionHost"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/nginx/redirection-hosts/{hostID}/disable": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Disable a Redirection Host */
        post: operations["disableRedirectionHost"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/nginx/dead-hosts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get all 404 hosts */
        get: operations["getDeadHosts"];
        put?: never;
        /** Create a 404 Host */
        post: operations["create404Host"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/nginx/dead-hosts/{hostID}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a 404 Host */
        get: operations["getDeadHost"];
        /** Update a 404 Host */
        put: operations["updateDeadHost"];
        post?: never;
        /** Delete a 404 Host */
        delete: operations["deleteDeadHost"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/nginx/dead-hosts/{hostID}/enable": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Enable a 404 Host */
        post: operations["enableDeadHost"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/nginx/dead-hosts/{hostID}/disable": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Disable a 404 Host */
        post: operations["disableDeadHost"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/nginx/streams": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get all streams */
        get: operations["getStreams"];
        put?: never;
        /** Create a Stream */
        post: operations["createStream"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/nginx/streams/{streamID}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a Stream */
        get: operations["getStream"];
        /** Update a Stream */
        put: operations["updateStream"];
        post?: never;
        /** Delete a Stream */
        delete: operations["deleteStream"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/nginx/streams/{streamID}/enable": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Enable a Stream */
        post: operations["enableStream"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/nginx/streams/{streamID}/disable": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Disable a Stream */
        post: operations["disableStream"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reports/hosts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Report on Host Statistics */
        get: operations["reportsHosts"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/schema": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Returns this swagger API schema */
        get: operations["schema"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/settings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get all settings */
        get: operations["getSettings"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/settings/{settingID}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a setting */
        get: operations["getSetting"];
        /** Update a setting */
        put: operations["updateSetting"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tokens": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Refresh your access token */
        get: operations["refreshToken"];
        put?: never;
        /** Request a new access token from credentials */
        post: operations["requestToken"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/version/check": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Returns any new version data from github */
        get: operations["checkVersion"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get all users */
        get: operations["getUsers"];
        put?: never;
        /** Create a User */
        post: operations["createUser"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/{userID}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a user */
        get: operations["getUser"];
        /** Update a User */
        put: operations["updateUser"];
        post?: never;
        /** Delete a User */
        delete: operations["deleteUser"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/{userID}/auth": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Update a User's Authentication */
        put: operations["updateUserAuth"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/{userID}/permissions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Update a User's Permissions */
        put: operations["updateUserPermissions"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/{userID}/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Login as this user */
        post: operations["loginAsUser"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** @description Health object */
        "health-object": {
            /**
             * @description Healthy
             * @example OK
             */
            status: string;
            /**
             * @description Whether the initial setup has been completed
             * @example true
             */
            setup?: boolean;
            /**
             * @description The version object
             * @example {
             *       "major": 2,
             *       "minor": 0,
             *       "revision": 0
             *     }
             */
            version: {
                /** @example 2 */
                major: number;
                /** @example 10 */
                minor: number;
                /** @example 1 */
                revision: number;
            };
        };
        /**
         * @description Unique identifier
         * @example 11
         */
        id: number;
        /**
         * @description Date and time of creation
         * @example 2025-10-28T04:17:54.000Z
         */
        created_on: string;
        /**
         * @description Date and time of last update
         * @example 2025-10-28T04:17:54.000Z
         */
        modified_on: string;
        /**
         * @description User ID
         * @example 2
         */
        user_id: number;
        /** @description User object */
        "user-object": {
            /**
             * @description User ID
             * @example 1
             */
            id: number;
            /**
             * @description Created Date
             * @example 2020-01-30T09:36:08.000Z
             */
            created_on: string;
            /**
             * @description Modified Date
             * @example 2020-01-30T09:41:04.000Z
             */
            modified_on: string;
            /**
             * @description Is user Disabled
             * @example true
             */
            is_disabled: boolean;
            /**
             * @description Email
             * @example jc@jc21.com
             */
            email: string;
            /**
             * @description Name
             * @example Jamie Curnow
             */
            name: string;
            /**
             * @description Nickname
             * @example James
             */
            nickname: string;
            /**
             * @description Gravatar URL based on email, without scheme
             * @example //www.gravatar.com/avatar/6193176330f8d38747f038c170ddb193?default=mm
             */
            avatar: string;
            /**
             * @description Roles applied
             * @example [
             *       "admin"
             *     ]
             */
            roles: string[];
            /** @description Permissions if expanded in request */
            permissions?: {
                /**
                 * @description Visibility level
                 * @example all
                 */
                visibility: string;
                /**
                 * @description Proxy Hosts access level
                 * @example manage
                 */
                proxy_hosts: string;
                /**
                 * @description Redirection Hosts access level
                 * @example manage
                 */
                redirection_hosts: string;
                /**
                 * @description Dead Hosts access level
                 * @example manage
                 */
                dead_hosts: string;
                /**
                 * @description Streams access level
                 * @example manage
                 */
                streams: string;
                /**
                 * @description Access Lists access level
                 * @example hidden
                 */
                access_lists: string;
                /**
                 * @description Certificates access level
                 * @example view
                 */
                certificates: string;
            };
        };
        /** @description Audit Log object */
        "audit-log-object": {
            id: components["schemas"]["id"];
            created_on: components["schemas"]["created_on"];
            modified_on: components["schemas"]["modified_on"];
            user_id: components["schemas"]["user_id"];
            /** @example certificate */
            object_type: string;
            object_id: components["schemas"]["id"];
            /** @example created */
            action: string;
            /** @example {} */
            meta: Record<string, never>;
            user?: components["schemas"]["user-object"];
        };
        /** @description Audit Log list */
        "audit-log-list": components["schemas"]["audit-log-object"][];
        /** @description Access List object */
        "access-list-object": {
            id: components["schemas"]["id"];
            created_on: components["schemas"]["created_on"];
            modified_on: components["schemas"]["modified_on"];
            owner_user_id: components["schemas"]["user_id"];
            /** @example My Access List */
            name: string;
            /** @example {} */
            meta: Record<string, never>;
            /** @example true */
            satisfy_any: boolean;
            /** @example false */
            pass_auth: boolean;
            /** @example 3 */
            proxy_host_count: number;
        };
        /** @example My Access List */
        name: string;
        /** @example true */
        satisfy_any: boolean;
        /** @example false */
        pass_auth: boolean;
        /**
         * @example [
         *       {
         *         "username": "admin",
         *         "password": "pass"
         *       }
         *     ]
         */
        access_items: {
            username?: string;
            password?: string;
        }[];
        /** @example 192.168.0.11 */
        address: string;
        /**
         * @example allow
         * @enum {string}
         */
        directive: "allow" | "deny";
        /**
         * @example [
         *       {
         *         "directive": "allow",
         *         "address": "192.168.0.0/24"
         *       }
         *     ]
         */
        access_clients: {
            address?: components["schemas"]["address"];
            directive?: components["schemas"]["directive"];
        }[];
        /** @example letsencrypt */
        ssl_provider: string;
        /** @description Certificate object */
        "certificate-object": {
            id: components["schemas"]["id"];
            created_on: components["schemas"]["created_on"];
            modified_on: components["schemas"]["modified_on"];
            owner_user_id: components["schemas"]["user_id"];
            provider: components["schemas"]["ssl_provider"];
            /**
             * @description Nice Name for the custom certificate
             * @example My Custom Cert
             */
            nice_name: string;
            /**
             * @description Domain Names separated by a comma
             * @example [
             *       "example.com",
             *       "www.example.com"
             *     ]
             */
            domain_names: string[];
            /**
             * @description Date and time of expiration
             * @example 2025-10-28T04:17:54.000Z
             */
            readonly expires_on: string;
            owner?: components["schemas"]["user-object"];
            /**
             * @example {
             *       "dns_challenge": false
             *     }
             */
            meta: {
                certificate?: string;
                certificate_key?: string;
                dns_challenge?: boolean;
                dns_provider_credentials?: string;
                dns_provider?: string;
                letsencrypt_certificate?: Record<string, never>;
                propagation_seconds?: number;
            };
        };
        /** @description Certificates list */
        "certificate-list": components["schemas"]["certificate-object"][];
        /**
         * @description Nice Name for the custom certificate
         * @example My Custom Cert
         */
        nice_name: string;
        /**
         * @description Domain Names separated by a comma
         * @example [
         *       "example.com",
         *       "www.example.com"
         *     ]
         */
        domain_names: string[];
        /**
         * @example {
         *       "dns_challenge": false
         *     }
         */
        meta: {
            certificate?: string;
            certificate_key?: string;
            dns_challenge?: boolean;
            dns_provider_credentials?: string;
            dns_provider?: string;
            letsencrypt_certificate?: Record<string, never>;
            propagation_seconds?: number;
        };
        /** @description Error object */
        "error-object": {
            /** @example 400 */
            code: number;
            /** @example Bad Request */
            message: string;
        };
        /** @description Error */
        error: {
            error?: components["schemas"]["error-object"];
        };
        /** @description DNS Providers list */
        "dns-providers-list": {
            /** @description Unique identifier for the DNS provider, matching the python package */
            id: string;
            /** @description Human-readable name of the DNS provider */
            name: string;
            /** @description Instructions on how to format the credentials for this DNS provider */
            credentials: string;
        }[];
        /**
         * @description Domain Names separated by a comma
         * @example [
         *       "example.com",
         *       "www.example.com"
         *     ]
         */
        "properties-domain_names": string[];
        /**
         * @description Access List ID
         * @example 3
         */
        access_list_id: number;
        /**
         * @description Certificate ID
         * @example 5
         */
        certificate_id: number | string;
        /**
         * @description Is SSL Forced
         * @example true
         */
        ssl_forced: boolean;
        /**
         * @description Should we cache assets
         * @example true
         */
        caching_enabled: boolean;
        /**
         * @description Should we block common exploits
         * @example false
         */
        block_exploits: boolean;
        /**
         * @description HTTP2 Protocol Support
         * @example true
         */
        http2_support: boolean;
        /**
         * @description Is Enabled
         * @example false
         */
        enabled: boolean;
        /**
         * @example http
         * @enum {string}
         */
        forward_scheme: "http" | "https";
        /** @example 127.0.0.1 */
        forward_host: string;
        /** @example 8080 */
        forward_port: number;
        /**
         * @description Is HSTS Enabled
         * @example true
         */
        hsts_enabled: boolean;
        /**
         * @description Is HSTS applicable to all subdomains
         * @example true
         */
        hsts_subdomains: boolean;
        /** @description Proxy Host object */
        "proxy-host-object": {
            id: components["schemas"]["id"];
            created_on: components["schemas"]["created_on"];
            modified_on: components["schemas"]["modified_on"];
            owner_user_id: components["schemas"]["user_id"];
            domain_names: components["schemas"]["properties-domain_names"];
            /** @example 127.0.0.1 */
            forward_host: string;
            /** @example 8080 */
            forward_port: number;
            access_list_id: components["schemas"]["access_list_id"];
            certificate_id: components["schemas"]["certificate_id"];
            ssl_forced: components["schemas"]["ssl_forced"];
            caching_enabled: components["schemas"]["caching_enabled"];
            block_exploits: components["schemas"]["block_exploits"];
            /** @example  */
            advanced_config: string;
            /**
             * @example {
             *       "nginx_online": true,
             *       "nginx_err": null
             *     }
             */
            meta: Record<string, never>;
            /**
             * @description Allow Websocket Upgrade for all paths
             * @example true
             */
            allow_websocket_upgrade: boolean;
            http2_support: components["schemas"]["http2_support"];
            /**
             * @example http
             * @enum {string}
             */
            forward_scheme: "http" | "https";
            enabled: components["schemas"]["enabled"];
            /**
             * @example [
             *       {
             *         "path": "/app",
             *         "forward_scheme": "http",
             *         "forward_host": "example.com",
             *         "forward_port": 80
             *       }
             *     ]
             */
            locations: {
                id?: number | null;
                path: string;
                forward_scheme: components["schemas"]["forward_scheme"];
                forward_host: components["schemas"]["forward_host"];
                forward_port: components["schemas"]["forward_port"];
                forward_path?: string;
                advanced_config?: string;
            }[];
            hsts_enabled: components["schemas"]["hsts_enabled"];
            hsts_subdomains: components["schemas"]["hsts_subdomains"];
            /** @example null */
            certificate?: null | components["schemas"]["certificate-object"];
            owner?: components["schemas"]["user-object"];
            /** @example null */
            access_list?: null | components["schemas"]["access-list-object"];
        };
        /** @description Proxy Hosts list */
        "proxy-host-list": components["schemas"]["proxy-host-object"][];
        /**
         * @description Allow Websocket Upgrade for all paths
         * @example true
         */
        allow_websocket_upgrade: boolean;
        /** @example  */
        advanced_config: string;
        /**
         * @example {
         *       "nginx_online": true,
         *       "nginx_err": null
         *     }
         */
        "properties-meta": Record<string, never>;
        /**
         * @example [
         *       {
         *         "path": "/app",
         *         "forward_scheme": "http",
         *         "forward_host": "example.com",
         *         "forward_port": 80
         *       }
         *     ]
         */
        locations: {
            id?: number | null;
            path: string;
            forward_scheme: components["schemas"]["forward_scheme"];
            forward_host: components["schemas"]["forward_host"];
            forward_port: components["schemas"]["forward_port"];
            forward_path?: string;
            advanced_config?: string;
        }[];
        /** @description Redirection Host object */
        "redirection-host-object": {
            id: components["schemas"]["id"];
            created_on: components["schemas"]["created_on"];
            modified_on: components["schemas"]["modified_on"];
            owner_user_id: components["schemas"]["user_id"];
            domain_names: components["schemas"]["properties-domain_names"];
            /**
             * @description Redirect HTTP Status Code
             * @example 302
             */
            forward_http_code: number;
            /**
             * @example http
             * @enum {string}
             */
            forward_scheme: "auto" | "http" | "https";
            /**
             * @description Domain Name
             * @example jc21.com
             */
            forward_domain_name: string;
            /**
             * @description Should the path be preserved
             * @example true
             */
            preserve_path: boolean;
            certificate_id: components["schemas"]["certificate_id"];
            ssl_forced: components["schemas"]["ssl_forced"];
            hsts_enabled: components["schemas"]["hsts_enabled"];
            hsts_subdomains: components["schemas"]["hsts_subdomains"];
            http2_support: components["schemas"]["http2_support"];
            block_exploits: components["schemas"]["block_exploits"];
            /** @example  */
            advanced_config: string;
            enabled: components["schemas"]["enabled"];
            /**
             * @example {
             *       "nginx_online": true,
             *       "nginx_err": null
             *     }
             */
            meta: Record<string, never>;
            /** @example null */
            certificate?: null | components["schemas"]["certificate-object"];
            owner?: components["schemas"]["user-object"];
        };
        /** @description Redirection Hosts list */
        "redirection-host-list": components["schemas"]["redirection-host-object"][];
        /**
         * @description Redirect HTTP Status Code
         * @example 302
         */
        forward_http_code: number;
        /**
         * @example http
         * @enum {string}
         */
        "properties-forward_scheme": "auto" | "http" | "https";
        /**
         * @description Domain Name
         * @example jc21.com
         */
        forward_domain_name: string;
        /**
         * @description Should the path be preserved
         * @example true
         */
        preserve_path: boolean;
        /** @description 404 Host object */
        "dead-host-object": {
            id: components["schemas"]["id"];
            created_on: components["schemas"]["created_on"];
            modified_on: components["schemas"]["modified_on"];
            owner_user_id: components["schemas"]["user_id"];
            domain_names: components["schemas"]["properties-domain_names"];
            certificate_id: components["schemas"]["certificate_id"];
            ssl_forced: components["schemas"]["ssl_forced"];
            hsts_enabled: components["schemas"]["hsts_enabled"];
            hsts_subdomains: components["schemas"]["hsts_subdomains"];
            http2_support: components["schemas"]["http2_support"];
            /** @example  */
            advanced_config: string;
            enabled: components["schemas"]["enabled"];
            /** @example {} */
            meta: Record<string, never>;
            /** @example null */
            certificate?: null | components["schemas"]["certificate-object"];
            owner?: components["schemas"]["user-object"];
        };
        /** @description 404 Hosts list */
        "dead-host-list": components["schemas"]["dead-host-object"][];
        /** @example {} */
        "dead-host-object_properties-meta": Record<string, never>;
        /** @description Stream object */
        "stream-object": {
            id: components["schemas"]["id"];
            created_on: components["schemas"]["created_on"];
            modified_on: components["schemas"]["modified_on"];
            owner_user_id: components["schemas"]["user_id"];
            /** @example 9090 */
            incoming_port: number;
            /** @example example.com */
            forwarding_host: string;
            /** @example 80 */
            forwarding_port: number;
            /** @example true */
            tcp_forwarding: boolean;
            /** @example false */
            udp_forwarding: boolean;
            enabled: components["schemas"]["enabled"];
            certificate_id?: components["schemas"]["certificate_id"];
            /** @example {} */
            meta: Record<string, never>;
            /** @example null */
            certificate?: null | components["schemas"]["certificate-object"];
            owner?: components["schemas"]["user-object"];
        };
        /** @description Streams list */
        "stream-list": components["schemas"]["stream-object"][];
        /** @example 9090 */
        incoming_port: number;
        /** @example example.com */
        forwarding_host: string;
        /** @example 80 */
        forwarding_port: number;
        /** @example true */
        tcp_forwarding: boolean;
        /** @example false */
        udp_forwarding: boolean;
        /** @example {} */
        "stream-object_properties-meta": Record<string, never>;
        /** @description Setting object */
        "setting-object": {
            /**
             * @description Setting ID
             * @example default-site
             */
            id: string;
            /**
             * @description Setting Display Name
             * @example Default Site
             */
            name: string;
            /**
             * @description Meaningful description
             * @example What to show when Nginx is hit with an unknown Host
             */
            description: string;
            /**
             * @description Value in almost any form
             * @example congratulations
             */
            value: string | number | Record<string, never> | unknown[];
            /**
             * @description Extra metadata
             * @example {
             *       "redirect": "http://example.com",
             *       "html": "<h1>404</h1>"
             *     }
             */
            meta: Record<string, never>;
        };
        /** @description Setting list */
        "setting-list": components["schemas"]["setting-object"][];
        /** @description Token object */
        "token-object": {
            /**
             * @description Token Expiry ISO Time String
             * @example 2025-02-04T20:40:46.340Z
             */
            expires: string;
            /**
             * @description JWT Token
             * @example eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.ey...xaHKYr3Kk6MvkUjcC4
             */
            token: string;
        };
        /** @description Check Version object */
        "check-version-object": {
            /**
             * @description Current version string
             * @example v2.10.1
             */
            current: string | null;
            /**
             * @description Latest version string
             * @example v2.13.4
             */
            latest: string | null;
            /**
             * @description Whether there's an update available
             * @example true
             */
            update_available: boolean;
        };
        /** @description User list */
        "user-list": components["schemas"]["user-object"][];
        /**
         * @description Name
         * @example Jamie Curnow
         */
        "properties-name": string;
        /**
         * @description Nickname
         * @example James
         */
        nickname: string;
        /**
         * @description Email
         * @example jc@jc21.com
         */
        email: string;
        /**
         * @description Roles applied
         * @example [
         *       "admin"
         *     ]
         */
        roles: string[];
        /**
         * @description Is user Disabled
         * @example true
         */
        is_disabled: boolean;
        "permission-object": {
            /**
             * @description Visibility Type
             * @example all
             * @enum {string}
             */
            visibility?: "all" | "user";
            /**
             * @description Access Lists Permissions
             * @example view
             * @enum {string}
             */
            access_lists?: "hidden" | "view" | "manage";
            /**
             * @description 404 Hosts Permissions
             * @example manage
             * @enum {string}
             */
            dead_hosts?: "hidden" | "view" | "manage";
            /**
             * @description Proxy Hosts Permissions
             * @example hidden
             * @enum {string}
             */
            proxy_hosts?: "hidden" | "view" | "manage";
            /**
             * @description Redirection Permissions
             * @example view
             * @enum {string}
             */
            redirection_hosts?: "hidden" | "view" | "manage";
            /**
             * @description Streams Permissions
             * @example manage
             * @enum {string}
             */
            streams?: "hidden" | "view" | "manage";
            /**
             * @description Certificates Permissions
             * @example hidden
             * @enum {string}
             */
            certificates?: "hidden" | "view" | "manage";
        };
    };
    responses: never;
    parameters: never;
    requestBodies: {
        /** @description Certificate Files */
        certificate_files: {
            content: {
                /**
                 * @example {
                 *       "certificate": "-----BEGIN CERTIFICATE-----\nMIID...-----END CERTIFICATE-----",
                 *       "certificate_key": "-----BEGIN PRIVATE\nMIID...-----END CERTIFICATE-----"
                 *     }
                 */
                "multipart/form-data": {
                    /**
                     * @example -----BEGIN CERTIFICATE-----
                     *     MIID...-----END CERTIFICATE-----
                     */
                    certificate: string;
                    /**
                     * @example -----BEGIN CERTIFICATE-----
                     *     MIID...-----END CERTIFICATE-----
                     */
                    certificate_key: string;
                    /**
                     * @example -----BEGIN CERTIFICATE-----
                     *     MIID...-----END CERTIFICATE-----
                     */
                    intermediate_certificate?: string;
                };
            };
        };
    };
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    health: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["health-object"];
                };
            };
        };
    };
    getAuditLogs: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["audit-log-list"];
                };
            };
        };
    };
    getAuditLog: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Audit Log Event ID
                 * @example 1
                 */
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["audit-log-object"];
                };
            };
        };
    };
    getAccessLists: {
        parameters: {
            query?: {
                /** @description Expansions */
                expand?: "owner" | "items" | "clients" | "proxy_hosts";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": 1,
                     *       "created_on": "2024-10-08T22:15:40.000Z",
                     *       "modified_on": "2024-10-08T22:15:40.000Z",
                     *       "owner_user_id": 1,
                     *       "name": "test1234",
                     *       "meta": {},
                     *       "satisfy_any": true,
                     *       "pass_auth": false,
                     *       "proxy_host_count": 0
                     *     }
                     */
                    "application/json": components["schemas"]["access-list-object"];
                };
            };
        };
    };
    createAccessList: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Access List Payload */
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "name": "My Access List",
                 *       "satisfy_any": true,
                 *       "pass_auth": false,
                 *       "items": [
                 *         {
                 *           "username": "admin",
                 *           "password": "pass"
                 *         }
                 *       ],
                 *       "clients": [
                 *         {
                 *           "directive": "allow",
                 *           "address": "192.168.0.0/24"
                 *         }
                 *       ]
                 *     }
                 */
                "application/json": {
                    name: components["schemas"]["name"];
                    satisfy_any?: components["schemas"]["satisfy_any"];
                    pass_auth?: components["schemas"]["pass_auth"];
                    items?: components["schemas"]["access_items"];
                    clients?: components["schemas"]["access_clients"];
                };
            };
        };
        responses: {
            /** @description 201 response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["access-list-object"];
                };
            };
        };
    };
    getAccessList: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Access List ID
                 * @example 1
                 */
                listID: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["access-list-object"];
                };
            };
        };
    };
    updateAccessList: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Access List ID
                 * @example 2
                 */
                listID: number;
            };
            cookie?: never;
        };
        /** @description Access List Payload */
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "name": "My Access List",
                 *       "satisfy_any": true,
                 *       "pass_auth": false,
                 *       "items": [
                 *         {
                 *           "username": "admin2",
                 *           "password": "pass2"
                 *         }
                 *       ],
                 *       "clients": [
                 *         {
                 *           "directive": "allow",
                 *           "address": "192.168.0.0/24"
                 *         }
                 *       ]
                 *     }
                 */
                "application/json": {
                    name?: components["schemas"]["name"];
                    satisfy_any?: components["schemas"]["satisfy_any"];
                    pass_auth?: components["schemas"]["pass_auth"];
                    items?: components["schemas"]["access_items"];
                    clients?: components["schemas"]["access_clients"];
                };
            };
        };
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["access-list-object"];
                };
            };
        };
    };
    deleteAccessList: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Access List ID
                 * @example 2
                 */
                listID: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": boolean;
                };
            };
        };
    };
    getCertificates: {
        parameters: {
            query?: {
                /** @description Expansions */
                expand?: "owner";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["certificate-list"];
                };
            };
        };
    };
    createCertificate: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Certificate Payload */
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "provider": "letsencrypt",
                 *       "domain_names": [
                 *         "test.example.com"
                 *       ],
                 *       "meta": {
                 *         "dns_challenge": false
                 *       }
                 *     }
                 */
                "application/json": {
                    provider: components["schemas"]["ssl_provider"];
                    nice_name?: components["schemas"]["nice_name"];
                    domain_names?: components["schemas"]["domain_names"];
                    meta?: components["schemas"]["meta"];
                };
            };
        };
        responses: {
            /** @description 201 response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["certificate-object"];
                };
            };
            /** @description 400 response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error"];
                };
            };
        };
    };
    getDNSProviders: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["dns-providers-list"];
                };
            };
        };
    };
    validateCertificates: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: components["requestBodies"]["certificate_files"];
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        certificate: {
                            /** @example example.com */
                            cn: string;
                            /** @example C = US, O = Let's Encrypt, CN = E5 */
                            issuer: string;
                            /**
                             * @example {
                             *       "from": 1728448218,
                             *       "to": 1736224217
                             *     }
                             */
                            dates: {
                                from: number;
                                to: number;
                            };
                        };
                        /** @example true */
                        certificate_key: boolean;
                    };
                };
            };
            /** @description 400 response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error"];
                };
            };
        };
    };
    testHttpReach: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Test Payload */
        requestBody: {
            content: {
                "application/json": {
                    domains: components["schemas"]["properties-domain_names"];
                };
            };
        };
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    getCertificate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Certificate ID
                 * @example 1
                 */
                certID: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["certificate-object"];
                };
            };
        };
    };
    deleteCertificate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Certificate ID
                 * @example 2
                 */
                certID: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": boolean;
                };
            };
        };
    };
    downloadCertificate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Certificate ID
                 * @example 1
                 */
                certID: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/zip": string;
                };
            };
        };
    };
    renewCertificate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Certificate ID
                 * @example 1
                 */
                certID: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["certificate-object"];
                };
            };
        };
    };
    uploadCertificate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Certificate ID
                 * @example 1
                 */
                certID: number;
            };
            cookie?: never;
        };
        requestBody?: components["requestBodies"]["certificate_files"];
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /**
                         * @example -----BEGIN CERTIFICATE-----
                         *     MIID...-----END CERTIFICATE-----
                         */
                        certificate: string;
                        /**
                         * @example -----BEGIN CERTIFICATE-----
                         *     MIID...-----END CERTIFICATE-----
                         */
                        certificate_key: string;
                        /**
                         * @example -----BEGIN CERTIFICATE-----
                         *     MIID...-----END CERTIFICATE-----
                         */
                        intermediate_certificate?: string;
                    };
                };
            };
        };
    };
    getProxyHosts: {
        parameters: {
            query?: {
                /** @description Expansions */
                expand?: "access_list" | "owner" | "certificate";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["proxy-host-list"];
                };
            };
        };
    };
    createProxyHost: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Proxy Host Payload */
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "domain_names": [
                 *         "test.example.com"
                 *       ],
                 *       "forward_scheme": "http",
                 *       "forward_host": "127.0.0.1",
                 *       "forward_port": 8080
                 *     }
                 */
                "application/json": {
                    domain_names: components["schemas"]["properties-domain_names"];
                    forward_scheme: components["schemas"]["forward_scheme"];
                    forward_host: components["schemas"]["forward_host"];
                    forward_port: components["schemas"]["forward_port"];
                    certificate_id?: components["schemas"]["certificate_id"];
                    ssl_forced?: components["schemas"]["ssl_forced"];
                    hsts_enabled?: components["schemas"]["hsts_enabled"];
                    hsts_subdomains?: components["schemas"]["hsts_subdomains"];
                    http2_support?: components["schemas"]["http2_support"];
                    block_exploits?: components["schemas"]["block_exploits"];
                    caching_enabled?: components["schemas"]["caching_enabled"];
                    allow_websocket_upgrade?: components["schemas"]["allow_websocket_upgrade"];
                    access_list_id?: components["schemas"]["access_list_id"];
                    advanced_config?: components["schemas"]["advanced_config"];
                    enabled?: components["schemas"]["enabled"];
                    meta?: components["schemas"]["properties-meta"];
                    locations?: components["schemas"]["locations"];
                };
            };
        };
        responses: {
            /** @description 201 response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["proxy-host-object"];
                };
            };
        };
    };
    getProxyHost: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description The ID of the Proxy Host
                 * @example 1
                 */
                hostID: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["proxy-host-object"];
                };
            };
        };
    };
    updateProxyHost: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description The ID of the Proxy Host
                 * @example 2
                 */
                hostID: number;
            };
            cookie?: never;
        };
        /** @description Proxy Host Payload */
        requestBody: {
            content: {
                "application/json": {
                    domain_names?: components["schemas"]["properties-domain_names"];
                    forward_scheme?: components["schemas"]["forward_scheme"];
                    forward_host?: components["schemas"]["forward_host"];
                    forward_port?: components["schemas"]["forward_port"];
                    certificate_id?: components["schemas"]["certificate_id"];
                    ssl_forced?: components["schemas"]["ssl_forced"];
                    hsts_enabled?: components["schemas"]["hsts_enabled"];
                    hsts_subdomains?: components["schemas"]["hsts_subdomains"];
                    http2_support?: components["schemas"]["http2_support"];
                    block_exploits?: components["schemas"]["block_exploits"];
                    caching_enabled?: components["schemas"]["caching_enabled"];
                    allow_websocket_upgrade?: components["schemas"]["allow_websocket_upgrade"];
                    access_list_id?: components["schemas"]["access_list_id"];
                    advanced_config?: components["schemas"]["advanced_config"];
                    enabled?: components["schemas"]["enabled"];
                    meta?: components["schemas"]["properties-meta"];
                    locations?: components["schemas"]["locations"];
                };
            };
        };
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["proxy-host-object"];
                };
            };
        };
    };
    deleteProxyHost: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description The ID of the Proxy Host
                 * @example 2
                 */
                hostID: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": boolean;
                };
            };
        };
    };
    enableProxyHost: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description The ID of the Proxy Host
                 * @example 2
                 */
                hostID: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": boolean;
                };
            };
            /** @description 400 response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error"];
                };
            };
        };
    };
    disableProxyHost: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description The ID of the Proxy Host
                 * @example 2
                 */
                hostID: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": boolean;
                };
            };
            /** @description 400 response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error"];
                };
            };
        };
    };
    getRedirectionHosts: {
        parameters: {
            query?: {
                /** @description Expansions */
                expand?: "owner" | "certificate";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["redirection-host-list"];
                };
            };
        };
    };
    createRedirectionHost: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Redirection Host Payload */
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "domain_names": [
                 *         "test.example.com"
                 *       ],
                 *       "forward_domain_name": "example.com",
                 *       "forward_scheme": "auto",
                 *       "forward_http_code": 301,
                 *       "preserve_path": false,
                 *       "block_exploits": false,
                 *       "certificate_id": 0,
                 *       "ssl_forced": false,
                 *       "http2_support": false,
                 *       "hsts_enabled": false,
                 *       "hsts_subdomains": false,
                 *       "advanced_config": "",
                 *       "meta": {}
                 *     }
                 */
                "application/json": {
                    domain_names: components["schemas"]["properties-domain_names"];
                    forward_http_code: components["schemas"]["forward_http_code"];
                    forward_scheme: components["schemas"]["properties-forward_scheme"];
                    forward_domain_name: components["schemas"]["forward_domain_name"];
                    preserve_path?: components["schemas"]["preserve_path"];
                    certificate_id?: components["schemas"]["certificate_id"];
                    ssl_forced?: components["schemas"]["ssl_forced"];
                    hsts_enabled?: components["schemas"]["hsts_enabled"];
                    hsts_subdomains?: components["schemas"]["hsts_subdomains"];
                    http2_support?: components["schemas"]["http2_support"];
                    block_exploits?: components["schemas"]["block_exploits"];
                    advanced_config?: components["schemas"]["advanced_config"];
                    meta?: components["schemas"]["properties-meta"];
                };
            };
        };
        responses: {
            /** @description 201 response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["redirection-host-object"];
                };
            };
        };
    };
    getRedirectionHost: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description The ID of the Redirection Host
                 * @example 1
                 */
                hostID: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["redirection-host-object"];
                };
            };
        };
    };
    updateRedirectionHost: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description The ID of the Redirection Host
                 * @example 2
                 */
                hostID: number;
            };
            cookie?: never;
        };
        /** @description Redirection Host       Payload */
        requestBody: {
            content: {
                "application/json": {
                    domain_names?: components["schemas"]["properties-domain_names"];
                    forward_http_code?: components["schemas"]["forward_http_code"];
                    forward_scheme?: components["schemas"]["properties-forward_scheme"];
                    forward_domain_name?: components["schemas"]["forward_domain_name"];
                    preserve_path?: components["schemas"]["preserve_path"];
                    certificate_id?: components["schemas"]["certificate_id"];
                    ssl_forced?: components["schemas"]["ssl_forced"];
                    hsts_enabled?: components["schemas"]["hsts_enabled"];
                    hsts_subdomains?: components["schemas"]["hsts_subdomains"];
                    http2_support?: components["schemas"]["http2_support"];
                    block_exploits?: components["schemas"]["block_exploits"];
                    advanced_config?: components["schemas"]["advanced_config"];
                    meta?: components["schemas"]["properties-meta"];
                };
            };
        };
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["redirection-host-object"];
                };
            };
        };
    };
    deleteRedirectionHost: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description The ID of the Redirection Host
                 * @example 2
                 */
                hostID: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": boolean;
                };
            };
        };
    };
    enableRedirectionHost: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description The ID of the Redirection Host
                 * @example 2
                 */
                hostID: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": boolean;
                };
            };
            /** @description 400 response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error"];
                };
            };
        };
    };
    disableRedirectionHost: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description The ID of the Redirection Host
                 * @example 2
                 */
                hostID: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": boolean;
                };
            };
            /** @description 400 response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error"];
                };
            };
        };
    };
    getDeadHosts: {
        parameters: {
            query?: {
                /** @description Expansions */
                expand?: "owner" | "certificate";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["dead-host-list"];
                };
            };
        };
    };
    create404Host: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description 404 Host Payload */
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "domain_names": [
                 *         "test.example.com"
                 *       ],
                 *       "certificate_id": 0,
                 *       "ssl_forced": false,
                 *       "advanced_config": "",
                 *       "http2_support": false,
                 *       "hsts_enabled": false,
                 *       "hsts_subdomains": false,
                 *       "meta": {}
                 *     }
                 */
                "application/json": {
                    domain_names: components["schemas"]["properties-domain_names"];
                    certificate_id?: components["schemas"]["certificate_id"];
                    ssl_forced?: components["schemas"]["ssl_forced"];
                    hsts_enabled?: components["schemas"]["hsts_enabled"];
                    hsts_subdomains?: components["schemas"]["hsts_subdomains"];
                    http2_support?: components["schemas"]["http2_support"];
                    advanced_config?: components["schemas"]["advanced_config"];
                    meta?: components["schemas"]["dead-host-object_properties-meta"];
                };
            };
        };
        responses: {
            /** @description 201 response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["dead-host-object"];
                };
            };
        };
    };
    getDeadHost: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description The ID of the 404 Host
                 * @example 1
                 */
                hostID: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["dead-host-object"];
                };
            };
        };
    };
    updateDeadHost: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description The ID of the 404 Host
                 * @example 2
                 */
                hostID: number;
            };
            cookie?: never;
        };
        /** @description 404 Host Payload */
        requestBody: {
            content: {
                "application/json": {
                    domain_names?: components["schemas"]["properties-domain_names"];
                    certificate_id?: components["schemas"]["certificate_id"];
                    ssl_forced?: components["schemas"]["ssl_forced"];
                    hsts_enabled?: components["schemas"]["hsts_enabled"];
                    hsts_subdomains?: components["schemas"]["hsts_subdomains"];
                    http2_support?: components["schemas"]["http2_support"];
                    advanced_config?: components["schemas"]["advanced_config"];
                    meta?: components["schemas"]["dead-host-object_properties-meta"];
                };
            };
        };
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["dead-host-object"];
                };
            };
        };
    };
    deleteDeadHost: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description The ID of the 404 Host
                 * @example 2
                 */
                hostID: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": boolean;
                };
            };
        };
    };
    enableDeadHost: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description The ID of the 404 Host
                 * @example 2
                 */
                hostID: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": boolean;
                };
            };
            /** @description 400 response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error"];
                };
            };
        };
    };
    disableDeadHost: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description The ID of the 404 Host
                 * @example 2
                 */
                hostID: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": boolean;
                };
            };
            /** @description 400 response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error"];
                };
            };
        };
    };
    getStreams: {
        parameters: {
            query?: {
                /** @description Expansions */
                expand?: "owner" | "certificate";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["stream-list"];
                };
            };
        };
    };
    createStream: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Stream Payload */
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "incoming_port": 8888,
                 *       "forwarding_host": "127.0.0.1",
                 *       "forwarding_port": 8080,
                 *       "tcp_forwarding": true,
                 *       "udp_forwarding": false,
                 *       "certificate_id": 0,
                 *       "meta": {}
                 *     }
                 */
                "application/json": {
                    incoming_port: components["schemas"]["incoming_port"];
                    forwarding_host: components["schemas"]["forwarding_host"];
                    forwarding_port: components["schemas"]["forwarding_port"];
                    tcp_forwarding?: components["schemas"]["tcp_forwarding"];
                    udp_forwarding?: components["schemas"]["udp_forwarding"];
                    certificate_id?: components["schemas"]["certificate_id"];
                    meta?: components["schemas"]["stream-object_properties-meta"];
                    domain_names?: components["schemas"]["properties-domain_names"];
                };
            };
        };
        responses: {
            /** @description 201 response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["stream-object"];
                };
            };
        };
    };
    getStream: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description The ID of the Stream
                 * @example 2
                 */
                streamID: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["stream-object"];
                };
            };
        };
    };
    updateStream: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description The ID of the Stream
                 * @example 2
                 */
                streamID: number;
            };
            cookie?: never;
        };
        /** @description Stream Payload */
        requestBody: {
            content: {
                "application/json": {
                    incoming_port?: components["schemas"]["incoming_port"];
                    forwarding_host?: components["schemas"]["forwarding_host"];
                    forwarding_port?: components["schemas"]["forwarding_port"];
                    tcp_forwarding?: components["schemas"]["tcp_forwarding"];
                    udp_forwarding?: components["schemas"]["udp_forwarding"];
                    certificate_id?: components["schemas"]["certificate_id"];
                    meta?: components["schemas"]["stream-object_properties-meta"];
                };
            };
        };
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["stream-object"];
                };
            };
        };
    };
    deleteStream: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description The ID of the Stream
                 * @example 2
                 */
                streamID: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": boolean;
                };
            };
        };
    };
    enableStream: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description The ID of the Stream
                 * @example 2
                 */
                streamID: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": boolean;
                };
            };
            /** @description 400 response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error"];
                };
            };
        };
    };
    disableStream: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description The ID of the Stream
                 * @example 2
                 */
                streamID: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": boolean;
                };
            };
            /** @description 400 response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["error"];
                };
            };
        };
    };
    reportsHosts: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /**
                         * @description Proxy Hosts Count
                         * @example 20
                         */
                        proxy?: number;
                        /**
                         * @description Redirection Hosts Count
                         * @example 2
                         */
                        redirection?: number;
                        /**
                         * @description Streams Count
                         * @example 0
                         */
                        stream?: number;
                        /**
                         * @description 404 Hosts Count
                         * @example 3
                         */
                        dead?: number;
                    };
                };
            };
        };
    };
    schema: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getSettings: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["setting-list"];
                };
            };
        };
    };
    getSetting: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Setting ID
                 * @example default-site
                 */
                settingID: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["setting-object"];
                };
            };
        };
    };
    updateSetting: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Setting ID
                 * @example default-site
                 */
                settingID: "default-site";
            };
            cookie?: never;
        };
        /** @description Setting Payload */
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "value": "congratulations",
                 *       "meta": {}
                 *     }
                 */
                "application/json": {
                    /**
                     * @example html
                     * @enum {string}
                     */
                    value?: "congratulations" | "404" | "444" | "redirect" | "html";
                    /**
                     * @example {
                     *       "html": "<p>hello world</p>"
                     *     }
                     */
                    meta?: {
                        redirect?: string;
                        html?: string;
                    };
                };
            };
        };
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["setting-object"];
                };
            };
        };
    };
    refreshToken: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["token-object"];
                };
            };
        };
    };
    requestToken: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Credentials Payload */
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "identity": "me@example.com",
                 *       "secret": "bigredhorsebanana"
                 *     }
                 */
                "application/json": {
                    /** @example me@example.com */
                    identity: string;
                    /**
                     * @example user
                     * @enum {string}
                     */
                    scope?: "user";
                    /** @example bigredhorsebanana */
                    secret: string;
                };
            };
        };
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["token-object"];
                };
            };
        };
    };
    checkVersion: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["check-version-object"];
                };
            };
        };
    };
    getUsers: {
        parameters: {
            query?: {
                /** @description Expansions */
                expand?: "permissions";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["user-list"];
                };
            };
        };
    };
    createUser: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description User Payload */
        requestBody: {
            content: {
                "application/json": {
                    name: components["schemas"]["properties-name"];
                    nickname: components["schemas"]["nickname"];
                    email: components["schemas"]["email"];
                    roles?: components["schemas"]["roles"];
                    is_disabled?: components["schemas"]["is_disabled"];
                    /**
                     * @description Auth Credentials
                     * @example {
                     *       "type": "password",
                     *       "secret": "bigredhorsebanana"
                     *     }
                     */
                    auth?: Record<string, never>;
                };
            };
        };
        responses: {
            /** @description 201 response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["user-object"];
                };
            };
        };
    };
    getUser: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description User ID or 'me' for yourself
                 * @example 1
                 */
                userID: string | number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["user-object"];
                };
            };
        };
    };
    updateUser: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description User ID or 'me' for yourself
                 * @example 2
                 */
                userID: string | number;
            };
            cookie?: never;
        };
        /** @description User Payload */
        requestBody: {
            content: {
                "application/json": {
                    name?: components["schemas"]["properties-name"];
                    nickname?: components["schemas"]["nickname"];
                    email?: components["schemas"]["email"];
                    roles?: components["schemas"]["roles"];
                    is_disabled?: components["schemas"]["is_disabled"];
                };
            };
        };
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["user-object"];
                };
            };
        };
    };
    deleteUser: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description User ID
                 * @example 2
                 */
                userID: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": boolean;
                };
            };
        };
    };
    updateUserAuth: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description User ID or 'me' for yourself
                 * @example 2
                 */
                userID: string | number;
            };
            cookie?: never;
        };
        /** @description Auth Payload */
        requestBody: {
            content: {
                "application/json": {
                    /** @example password */
                    type: string;
                    /** @example changeme */
                    current?: string;
                    /** @example mySuperN3wP@ssword! */
                    secret: string;
                };
            };
        };
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": boolean;
                };
            };
        };
    };
    updateUserPermissions: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description User ID
                 * @example 2
                 */
                userID: number;
            };
            cookie?: never;
        };
        /** @description Permissions Payload */
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "visibility": "all",
                 *       "access_lists": "view",
                 *       "certificates": "hidden",
                 *       "dead_hosts": "hidden",
                 *       "proxy_hosts": "manage",
                 *       "redirection_hosts": "hidden",
                 *       "streams": "hidden"
                 *     }
                 */
                "application/json": components["schemas"]["permission-object"];
            };
        };
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": boolean;
                };
            };
        };
    };
    loginAsUser: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description User ID
                 * @example 2
                 */
                userID: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 200 response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /**
                         * @description JWT Token
                         * @example eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.ey...xaHKYr3Kk6MvkUjcC4
                         */
                        token: string;
                        /**
                         * @description Token Expiry Timestamp
                         * @example 2020-01-30T10:43:44.000Z
                         */
                        expires: string;
                        user: components["schemas"]["user-object"];
                    };
                };
            };
        };
    };
}
