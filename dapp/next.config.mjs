// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { execSync } from 'child_process';
import nextMdx from '@next/mdx';

let NEXT_PUBLIC_IOTA_NAMES_REV = 'development';
const NEXT_PUBLIC_BUILD_ENV = process.env.BUILD_ENV;
const AMPLITUDE_ENABLED = process.env.AMPLITUDE_ENABLED;

try {
    if (process.env.VERCEL_GIT_COMMIT_SHA) {
        NEXT_PUBLIC_IOTA_NAMES_REV = process.env.VERCEL_GIT_COMMIT_SHA;
    } else {
        NEXT_PUBLIC_IOTA_NAMES_REV = execSync('git rev-parse HEAD').toString().trim();
    }
} catch (error) {
    console.warn('Could not get git revision, using default');
}

const withMDX = nextMdx();

/** @type {import('next').NextConfig} */
const nextConfig = withMDX({
    env: {
        AMPLITUDE_ENABLED,
        NEXT_PUBLIC_IOTA_NAMES_REV,
        NEXT_PUBLIC_BUILD_ENV,
    },
    experimental: {
        mdxRs: true,
        turbo: {
            resolveExtensions: ['.mdx', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
        },
    },
});

export default nextConfig;
