// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

module.exports = {
    plugins: ['unused-imports', 'prettier', 'require-extensions', 'license-check'],
    extends: [
        'react-app',
        'eslint:recommended',
        'prettier',
        'plugin:prettier/recommended',
        'plugin:import/typescript',
    ],
    settings: {
        react: {
            version: '18',
        },
        'import/resolver': {
            typescript: true,
        },
    },
    env: {
        es2020: true,
    },
    root: false,
    ignorePatterns: [
        'node_modules',
        'build',
        'dist',
        'coverage',
        'apps/icons/src',
        'next-env.d.ts',
        'doc/book',
        'external-crates',
        'storybook-static',
        '.next',
        'documentation',
        'packages',
    ],
    rules: {
        'no-case-declarations': 'off',
        'no-implicit-coercion': [2, { number: true, string: true, boolean: false }],
        '@typescript-eslint/no-redeclare': 'off',
        '@typescript-eslint/ban-types': [
            'error',
            {
                types: {
                    Buffer: 'Buffer usage increases bundle size and is not consistently implemented on web.',
                },
                extendDefaults: true,
            },
        ],
        'no-restricted-globals': [
            'error',
            {
                name: 'Buffer',
                message:
                    'Buffer usage increases bundle size and is not consistently implemented on web.',
            },
        ],
        'unused-imports/no-unused-imports': [
            'error',
            {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                vars: 'all',
                args: 'none',
                ignoreRestSiblings: true,
            },
        ],
        'license-check/license-check': 'error',
    },
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
};
