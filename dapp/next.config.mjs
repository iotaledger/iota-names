// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { execSync } from 'child_process';

let NEXT_PUBLIC_IOTA_NAMES_REV = 'development';

try {
    if (process.env.VERCEL_GIT_COMMIT_SHA) {
        NEXT_PUBLIC_IOTA_NAMES_REV = process.env.VERCEL_GIT_COMMIT_SHA;
    } else {
        NEXT_PUBLIC_IOTA_NAMES_REV = execSync('git rev-parse HEAD').toString().trim();
    }
} catch (error) {
    console.warn('Could not get git revision, using default');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        NEXT_PUBLIC_IOTA_NAMES_REV,
    },
};

export default nextConfig;
