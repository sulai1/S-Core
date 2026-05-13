import js from '@eslint/js';
import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';
import pluginQuasar from '@quasar/app-vite/eslint';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import prettierSkipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfigWithVueTs(
    pluginQuasar.configs.recommended(),
    js.configs.recommended,
    pluginVue.configs['flat/essential'],
    vueTsConfigs.recommendedTypeChecked,
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parserOptions: {
                tsconfigRootDir: __dirname,
            },
            globals: {
                ...globals.browser,
                ...globals.node,
                process: 'readonly',
            },
        },
        rules: {
            'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
            'prefer-promise-reject-errors': 'off',
        },
    },
    prettierSkipFormatting,
);
