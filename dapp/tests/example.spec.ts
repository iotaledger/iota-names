// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0
import 'dotenv/config';

import { CONFIG } from '@/config';

import { expect, test } from './helpers/fixtures';

test.describe('Basic e2e tests', () => {
    test('should load the application', async ({ appPage }) => {
        await appPage.waitForLoadState('networkidle');
        await expect(appPage).toHaveTitle(/IOTA Names/i);
    });

    test('should have IOTA Wallet extension loaded', async ({ extensionId, extensionContext }) => {
        expect(extensionId).toBeTruthy();
        expect(extensionId).toMatch(/^[a-z]{32}$/);

        const extensionUrl = `chrome-extension://${extensionId}/ui.html`;
        const extensionPage = await extensionContext.newPage();
        await extensionPage.goto(extensionUrl);

        await expect(extensionPage).toHaveURL(extensionUrl);
    });

    test('indexer is up and running', async () => {
        console.log('[Config]:', JSON.stringify(CONFIG, null, 2));
        console.log(`Checking indexer health at ${CONFIG.indexerUrl}/health`);
        const res = await fetch(`${CONFIG.indexerUrl}/health`);
        expect(res.ok).toBe(true);
    });
});
