import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 12,
                sourceType: 'module',
                project: './tsconfig.eslint.json'
            },
            globals: {
                console: 'readonly',
                process: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                module: 'readonly',
                require: 'readonly',
                exports: 'readonly'
            }
        },
        plugins: {
            '@typescript-eslint': tseslint
        },
        rules: {
            'semi': ['error', 'always'],
            'indent': ['error', 4, { 'SwitchCase': 1 }],
            'comma-dangle': ['error', 'never'],
            'no-trailing-spaces': 'error',
            'eol-last': ['error', 'always'],
            'max-len': ['warn', { 'code': 120, 'ignoreComments': true }],
            'object-curly-spacing': ['error', 'always'],
            'array-bracket-spacing': ['error', 'never'],
            'space-before-blocks': 'error',
            'keyword-spacing': ['error', { 'before': true, 'after': true }],
            'space-infix-ops': 'error',
            'comma-spacing': ['error', { 'before': false, 'after': true }],
            'brace-style': ['error', '1tbs', { 'allowSingleLine': true }],
            'no-console': ['warn', { 'allow': ['warn', 'error'] }],
            'no-debugger': 'error',
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['error', {
                'argsIgnorePattern': '^_',
                'varsIgnorePattern': '^_'
            }],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/naming-convention': [
                'warn',
                {
                    'selector': 'interface',
                    'format': ['PascalCase'],
                    'prefix': ['I']
                },
                {
                    'selector': 'typeAlias',
                    'format': ['PascalCase']
                },
                {
                    'selector': 'class',
                    'format': ['PascalCase']
                }
            ],
            '@typescript-eslint/explicit-module-boundary-types': 'warn',
            '@typescript-eslint/no-non-null-assertion': 'warn',
            '@typescript-eslint/prefer-nullish-coalescing': 'error',
            '@typescript-eslint/prefer-optional-chain': 'error',
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/await-thenable': 'error',
            'eqeqeq': ['error', 'always'],
            'curly': ['error', 'all'],
            'no-var': 'error',
            'prefer-const': 'error',
            'prefer-arrow-callback': 'error',
            'arrow-spacing': ['error', { 'before': true, 'after': true }],
            'no-multiple-empty-lines': ['error', { 'max': 1, 'maxEOF': 0 }],
            'no-duplicate-imports': 'error',
            '@typescript-eslint/consistent-type-imports': ['error', {
                'prefer': 'type-imports'
            }],
            '@typescript-eslint/naming-convention': [
                'error',
                {
                    'selector': 'interface',
                    'format': ['PascalCase'],
                },
                {
                    'selector': 'typeAlias',
                    'format': ['PascalCase']
                },
                {
                    'selector': 'class',
                    'format': ['PascalCase']
                }
            ]
        }
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 12,
            sourceType: 'module',
            globals: {
                console: 'readonly',
                process: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                module: 'readonly',
                require: 'readonly',
                exports: 'readonly'
            }
        }
    },
    {
        ignores: ['dist/**', 'node_modules/**', 'coverage/**', '**/*.d.ts']
    }
];