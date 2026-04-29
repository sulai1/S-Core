import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: ['node_modules/**/*', 'coverage/**/*', 'dist/**/*'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      'no-debugger': 'error',
      'no-console': 'warn',
      eqeqeq: ['error', 'always'],
    },
  },
];
