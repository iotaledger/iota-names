// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from '../helpers/fixtures';

test('should load the application', async ({ appPage, sharedState }) => {
    await appPage.waitForLoadState('domcontentloaded');
    await expect(appPage).toHaveTitle(/IOTA Names/i);
});

test('should have IOTA Wallet extension loaded', async ({ extensionId, context }) => {
    expect(extensionId).toBeTruthy();
    expect(extensionId).toMatch(/^[a-z]{32}$/);

    const extensionUrl = `chrome-extension://${extensionId}/ui.html`;
    const extensionPage = await context.newPage();
    await extensionPage.goto(extensionUrl);

    await expect(extensionPage).toHaveURL(extensionUrl);
});
