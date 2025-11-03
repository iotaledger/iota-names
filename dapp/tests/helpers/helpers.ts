// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { normalizeIotaName } from '@iota/iota-names-sdk';
import { BrowserContext, Page } from '@playwright/test';

import { expect } from '../helpers/fixtures';

export async function buyNameFromAvailabilityCheckDialog(
    page: Page,
    context: BrowserContext,
    nameToPurchase: string,
) {
    await page.getByPlaceholder('Check name availability').fill(nameToPurchase);
    const purchaseCardLocator = page.getByTestId('purchase-name-card');

    await purchaseCardLocator.waitFor();
    await expect(purchaseCardLocator).toBeVisible();

    await purchaseCardLocator.hover();
    await purchaseCardLocator.getByRole('button', { name: 'Buy' }).click({ timeout: 10_000 });
    await expect(page.getByTestId('name-purchase-title')).toContainText('@' + nameToPurchase);

    await page.getByRole('button', { name: 'Buy' }).click({ timeout: 10_000 });
    (await context.waitForEvent('page')).getByRole('button', { name: 'Approve' }).click();

    await page.bringToFront();
}

export function purchaseNameFactory(): () => string {
    const usedNames = new Set<string>();
    return function (): string {
        let name = '';
        do {
            name = 'test-' + Math.floor(Math.random() * 1000);
        } while (usedNames.has(name));
        usedNames.add(name);
        return name;
    };
}

export async function purchaseName(page: Page, context: BrowserContext) {
    const getPurchaseName = purchaseNameFactory();
    const nameToPurchase = getPurchaseName();

    await page.getByPlaceholder('Search for your IOTA name').click();

    await buyNameFromAvailabilityCheckDialog(page, context, nameToPurchase);

    const normalizedName = normalizeIotaName(nameToPurchase + '.iota', 'at', {
        truncateLongParts: true,
    });
    await expect(page.getByText(`Successfully registered name ${normalizedName}`)).toBeVisible({
        timeout: 60_000,
    });
    const closeIconDialog = page.getByTestId('close-icon');
    if (await closeIconDialog.isVisible().catch(() => false)) {
        await closeIconDialog.click();
    }
    const closeIcon = page.getByTestId('close-icon');
    if (await closeIcon.isVisible().catch(() => false)) {
        await closeIcon.click();
    }
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(200);
    await page.goto('/my-names', { waitUntil: 'commit' });
}
