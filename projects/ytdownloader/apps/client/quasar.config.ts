import { defineConfig } from '#q-app/wrappers';

export default defineConfig(() => {
    return {
        boot: ['api'],
        css: ['app.scss'],
        extras: ['material-icons', 'material-symbols-outlined'],

        build: {
            target: {
                browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
                node: 'node20',
            },
            typescript: {
                strict: true,
                vueShim: true,
            },
            vueRouterMode: 'hash',
            vitePlugins: [
                [
                    'vite-plugin-checker',
                    {
                        vueTsc: false,
                        eslint: {
                            lintCommand: 'eslint -c ./eslint.config.js "./src*/**/*.{ts,js,mjs,cjs,vue}"',
                            useFlatConfig: true,
                        },
                    },
                    { server: false },
                ],
            ],
        },

        devServer: {
            open: false,
            proxy: {
                '/api': {
                    target: 'http://localhost:3800',
                    changeOrigin: true,
                },
            },
        },

        framework: {
            plugins: ['Notify'],
        },

        animations: ['fadeIn', 'fadeInUp', 'fadeInDown'],
    };
});
