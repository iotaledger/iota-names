// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { execSync } from 'child_process';
import nextMdx from '@next/mdx';

let NEXT_PUBLIC_IOTA_NAMES_REV = 'development';

const NEXT_PUBLIC_NAMES_NETWORK = process.env.NEXT_PUBLIC_NAMES_NETWORK;
const NEXT_PUBLIC_NAMES_DISPLAY_API_URL = process.env.NEXT_PUBLIC_NAMES_DISPLAY_API_URL;

try {
    if (process.env.VERCEL_GIT_COMMIT_SHA) {
        NEXT_PUBLIC_IOTA_NAMES_REV = process.env.VERCEL_GIT_COMMIT_SHA;
    } else {
        NEXT_PUBLIC_IOTA_NAMES_REV = execSync('git rev-parse HEAD').toString().trim();
    }
} catch (error) {
    console.warn('Could not get git revision, using default');
}

if (!NEXT_PUBLIC_NAMES_NETWORK) {
    throw new Error('NEXT_PUBLIC_NAMES_NETWORK env must be configured');
}

if (!NEXT_PUBLIC_NAMES_DISPLAY_API_URL) {
    throw new Error('NEXT_PUBLIC_NAMES_DISPLAY_API_URL env must be configured');
}

const withMDX = nextMdx();

/** @type {import('next').NextConfig} */
const nextConfig = withMDX({
    env: {
        NEXT_PUBLIC_NAMES_NETWORK,
        NEXT_PUBLIC_IOTA_NAMES_REV,
        NEXT_PUBLIC_NAMES_DISPLAY_API_URL,
    },
    experimental: {
        mdxRs: true,
        turbo: {
            resolveExtensions: ['.mdx', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
        },
    },
});

export default nextConfig;
