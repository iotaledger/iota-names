// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable no-empty-pattern */

import path from 'path';
import { test as base, chromium, Page, type BrowserContext } from '@playwright/test';

import { createPage, waitForExtension } from './browser';

// Path to the IOTA Wallet extension (downloaded via `pnpm run test:prepare`)
const EXTENSION_PATH = path.join(__dirname, '../../wallet-dist');

const COMMON_ARGS = ['--user-agent=Playwright', '--disable-dev-shm-usage', '--no-sandbox'];

const DEFAULT_SHARED_STATE = { extension: {}, wallet: {} };

interface SharedState {
    sharedContext?: BrowserContext;
    extension: {
        url?: string;
        name?: string;
    };
    wallet: {
        address?: string;
        mnemonic?: string;
        page?: Page;
    };
}

let sharedState: SharedState = { ...DEFAULT_SHARED_STATE };

/**
 * Extended test with IOTA Wallet extension support
 */
export const test = base.extend<{
    sharedState: SharedState;
    extensionId: string;
    appPage: Page;
    extensionUrl: string;
    extensionName: string;
}>({
    sharedState: async ({}, use) => {
        await use(sharedState);
    },

    context: [
        async ({ sharedState }, use) => {
            const isCI = !!process.env.CI;

            if (sharedState.sharedContext) {
                await use(sharedState.sharedContext);
                return;
            }

            const context = await chromium.launchPersistentContext('', {
                headless: isCI,
                viewport: { width: 1440, height: 900 },
                args: [
                    ...COMMON_ARGS,
                    `--disable-extensions-except=${EXTENSION_PATH}`,
                    `--load-extension=${EXTENSION_PATH}`,
                    '--window-position=0,0',
                    ...(isCI ? ['--headless=new', '--disable-gpu'] : []),
                ],
            });

            sharedState.sharedContext = context;

            await use(context);
        },
        { scope: 'test' },
    ],

    extensionUrl: async ({ context }, use) => {
        const extensionUrl = await waitForExtension(context);
        await use(extensionUrl);
    },

    extensionId: async ({ extensionUrl }, use) => {
        const id = extensionUrl.split('/')[2];
        await use(id);
    },

    extensionName: async ({}, use) => {
        await use('IOTA Wallet');
    },

    appPage: async ({ context }, use) => {
        const page = await createPage(context, '/');
        await use(page);
    },
});

test.afterAll(async () => {
    if (sharedState.sharedContext) {
        await sharedState.sharedContext.close();
        sharedState = { ...DEFAULT_SHARED_STATE };
    }
});

export const expect = test.expect;
