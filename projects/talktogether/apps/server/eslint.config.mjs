import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import vitestPlugin from 'eslint-plugin-vitest';
import promisePlugin from 'eslint-plugin-promise';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import unicornPlugin from 'eslint-plugin-unicorn';
import { fileURLToPath } from 'url';
import path from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default [
    { ignores: ['coverage/**/*', 'dist/**/*', 'test/**/*'] },
    {
        files: ['**/*.ts'],
        // enable type-aware linting by providing a parser object and project tsconfig
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
                project: [path.resolve(__dirname, 'tsconfig.eslint.json')],
                tsconfigRootDir: __dirname,
            },
        },
        plugins: {
            '@typescript-eslint': typescriptPlugin,
            import: importPlugin,
            jest: vitestPlugin,
            promise: promisePlugin,
            sonarjs: sonarjsPlugin,
            unicorn: unicornPlugin
        },
        rules: {
            // Type-safety
            '@typescript-eslint/no-unsafe-assignment': 'error',
            '@typescript-eslint/no-unsafe-call': 'error',
            '@typescript-eslint/no-unsafe-member-access': 'error',
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

            // Imports
            'import/no-extraneous-dependencies': 'error',
            'import/no-cycle': 'error',
            'import/order': ['warn', { groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'], 'newlines-between': 'never' }],

            // Promises & async
            'promise/catch-or-return': 'warn',
            'promise/no-return-wrap': 'error',

            // Maintainability / smell
            'sonarjs/cognitive-complexity': ['warn', 15],
            // sonarjs no-duplicate-string expects an options object with allowed keys
            // Use `threshold` to set minimum occurrences and `ignoreStrings` to skip common strings
            'sonarjs/no-duplicate-string': ['warn', { threshold: 3, ignoreStrings: 'application/json' }],
            'complexity': ['warn', { max: 12 }],

            // Jest
            'jest/no-disabled-tests': 'warn',
            'jest/no-focused-tests': 'error',
            'jest/expect-expect': 'warn',

            // Hygiene
            'no-console': 'warn',
            'no-debugger': 'error',
            'eqeqeq': ['error', 'always'],
            'consistent-return': 'warn',
            'unicorn/prevent-abbreviations': 'off',
            'unicorn/no-useless-undefined': 'warn',
        },
    },

    // JS files (build outputs etc.) - keep minimal rules
    {
        files: ['**/*.js'],
        rules: {
            'no-console': 'warn',
        },
    },
];