// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { normalizeIotaName } from '@iota/iota-names-sdk';
import { formatAddress } from '@iota/iota-sdk/utils';
import { expect } from '@playwright/test';

import { denormalizeName } from '@/lib/utils';

import { test } from '../helpers/fixtures';
import { connectWallet, createWallet, requestFaucetTokens } from '../utils';

test.describe.serial('Purchase Name Tests', () => {
    test.beforeAll(async ({ appPage, context, extensionPage, extensionName, sharedState }) => {
        const { address, mnemonic } = await createWallet(extensionPage);

        await appPage.bringToFront();

        await connectWallet(appPage, context, extensionName);

        await expect(appPage.getByRole('button', { name: formatAddress(address) })).toBeVisible({
            timeout: 10_000,
        });

        await requestFaucetTokens(address);

        sharedState.wallet.address = address;
        sharedState.wallet.mnemonic = mnemonic;
    });

    test('Can purchase a name', async ({ appPage: page, context }) => {
        const nameToPurchase = `e2e-test-name`;

        await page.getByPlaceholder('Search for your IOTA name').filter({ visible: true }).click();

        await page.getByPlaceholder('Check name availability').fill(nameToPurchase);
        const purchaseCardLocator = page.getByTestId('purchase-name-card');

        await purchaseCardLocator.waitFor();
        await expect(purchaseCardLocator).toBeVisible();

        await purchaseCardLocator.hover();
        await purchaseCardLocator.getByRole('button', { name: 'Buy' }).click({ timeout: 10_000 });
        await expect(page.getByTestId('name-purchase-title')).toContainText('@' + nameToPurchase);

        await page.getByRole('button', { name: 'Buy' }).click({ timeout: 10_000 });
        (await context.waitForEvent('page')).getByRole('button', { name: 'Approve' }).click();

        const normalizedName = normalizeIotaName(nameToPurchase + '.iota', 'at', {
            truncateLongParts: true,
        });
        await expect(page.getByText(`Successfully registered name ${normalizedName}`)).toBeVisible({
            timeout: 30_000,
        });

        await page.bringToFront();
    });

    test('Availability Dialog opens from all UI elements', async ({ appPage: page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        await page.getByPlaceholder('Search for your IOTA name').filter({ visible: true }).click();

        expect(page.getByRole('dialog').getByPlaceholder('Check name availability')).toBeVisible({
            timeout: 5_000,
        });

        await page.goto('/auctions', { waitUntil: 'domcontentloaded' });

        await page
            .getByTestId('top-navbar')
            .getByPlaceholder('Search for your IOTA name')
            .filter({ visible: true })
            .click();

        expect(page.getByRole('dialog').getByPlaceholder('Check name availability')).toBeVisible({
            timeout: 5_000,
        });

        await page.goto('/my-names', { waitUntil: 'domcontentloaded' });

        await page.getByRole('button', { name: 'Name', exact: true }).click();

        expect(page.getByRole('dialog').getByPlaceholder('Check name availability')).toBeVisible({
            timeout: 5_000,
        });
    });

    test('Unavailable shows up for already purchased name', async ({ appPage: page }) => {
        // Name registered when initializing localnet with scripts/tests/register-name.ts
        const targetName = 'test.iota';
        const denormalizedName = denormalizeName(targetName);

        await page.getByPlaceholder('Search for your IOTA name').click();
        await page.getByPlaceholder('Check name availability').fill(denormalizedName);

        const namePurchaseCard = page.getByTestId('unavailable-purchase-card');
        await expect(namePurchaseCard).toContainText('@' + denormalizedName);
        await expect(namePurchaseCard).toContainText('Unavailable');
        await expect(namePurchaseCard).toContainText('Name is already taken.');
    });
});
