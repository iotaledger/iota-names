// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import path from 'path';
import { test as base, chromium, Page, type BrowserContext } from '@playwright/test';

import { createPage, waitForExtension } from './browser';

// Path to the IOTA Wallet extension (downloaded via `pnpm run test:prepare`)
const EXTENSION_PATH = path.join(__dirname, '../../wallet-dist');

const COMMON_ARGS = ['--user-agent=Playwright', '--disable-dev-shm-usage', '--no-sandbox'];

/**
 * Extended test with IOTA Wallet extension support
 */
export const test = base.extend<{
    extensionId: string;
    extensionContext: BrowserContext;
    appPage: Page;
}>({
    extensionId: async ({ extensionContext }, use) => {
        const extensionId = await waitForExtension(extensionContext);
        await use(extensionId);
    },

    // eslint-disable-next-line no-empty-pattern
    extensionContext: async ({}, use) => {
        const context = await chromium.launchPersistentContext('', {
            headless: false,
            args: [
                ...COMMON_ARGS,
                `--disable-extensions-except=${EXTENSION_PATH}`,
                `--load-extension=${EXTENSION_PATH}`,
            ],
        });

        await use(context);
        await context.close();
    },

    appPage: async ({ extensionContext }, use) => {
        const page = await createPage(extensionContext, '/');
        await use(page);
    },
});

export const expect = test.expect;
