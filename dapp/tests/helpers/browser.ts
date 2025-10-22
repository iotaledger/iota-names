// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Page, type BrowserContext } from '@playwright/test';

/**
 * Get the extension URL from the browser context
 */
export async function getExtensionUrl(browserContext: BrowserContext): Promise<string> {
    let [background] = browserContext.serviceWorkers();

    if (!background) {
        background = await browserContext.waitForEvent('serviceworker', { timeout: 30000 });
    }

    const extensionId = background.url().split('/')[2];
    return `chrome-extension://${extensionId}/ui.html`;
}

/**
 * Wait for the IOTA Wallet extension to load and return its url
 */
export async function waitForExtension(context: BrowserContext): Promise<string> {
    let [background] = context.serviceWorkers();
    if (!background) {
        background = await context.waitForEvent('serviceworker', { timeout: 30000 });
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const extensionUrl = background.url().replace('/background.js', '/ui.html');
    return extensionUrl;
}

/**
 * Create a new page and navigate to URL with error handling
 */
export async function createPage(context: BrowserContext, url = '/'): Promise<Page> {
    try {
        const page = await context.newPage();
        await page.goto(url, { waitUntil: 'commit' });
        return page;
    } catch (error) {
        console.error('Failed to create page:', error);
        throw error;
    }
}
