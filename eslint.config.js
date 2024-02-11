import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';

const config = [{
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaFeatures: { modules: true },
      ecmaVersion: 'latest',
      project: './tsconfig.json',
    },
  },
  plugins: {
    '@typescript-eslint': ts,
    ts,
    prettierPlugin,
  },
  rules: {
    ...ts.configs['eslint-recommended'].rules,
    ...ts.configs['recommended'].rules,
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
}]

export default config;
