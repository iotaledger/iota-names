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
    };
}

let sharedState: SharedState = { ...DEFAULT_SHARED_STATE };

/**
 * Extended test with IOTA Wallet extension support
 */
export const test = base.extend<{
    sharedState: SharedState;
    extensionId: string;
    extensionContext: BrowserContext;
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
                viewport: { width: 720, height: 720 },
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

    extensionId: async ({ extensionContext }, use) => {
        const extensionId = await waitForExtension(extensionContext);
        await use(extensionId);
    },

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

    extensionUrl: async ({ extensionId }, use) => {
        await use(`chrome-extension://${extensionId}/ui.html`);
    },

    extensionName: async ({}, use) => {
        await use('IOTA Wallet');
    },

    appPage: async ({ extensionContext }, use) => {
        const page = await createPage(extensionContext, '/');
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
