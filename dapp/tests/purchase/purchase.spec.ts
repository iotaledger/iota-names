// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { normalizeIotaName } from '@iota/iota-names-sdk';
import { formatAddress } from '@iota/iota-sdk/utils';
import { expect } from '@playwright/test';

import { test } from '../helpers/fixtures';
import { buyNameFromAvailabilityCheckDialog, purchaseNameFactory } from '../helpers/helpers';
import { connectWallet, createWallet, requestFaucetTokensOnWalletHome } from '../utils';

test.describe('Purchase Flow', () => {
    test.setTimeout(30_000);
    const getPurchaseName = purchaseNameFactory();

    test.beforeAll(async ({ appPage, context, extensionPage, extensionName, sharedState }) => {
        await appPage.goto('/', { waitUntil: 'commit' });

        const { address, mnemonic } = await createWallet(extensionPage);
        await requestFaucetTokensOnWalletHome(extensionPage, address);

        await appPage.bringToFront();

        await connectWallet(appPage, context, extensionName);

        await expect(appPage.getByRole('button', { name: formatAddress(address) })).toBeVisible({
            timeout: 10_000,
        });

        sharedState.wallet.address = address;
        sharedState.wallet.mnemonic = mnemonic;
    });

    test('Purchase name from Home', async ({ appPage: page, context }) => {
        const nameToPurchase = getPurchaseName();

        await page.getByPlaceholder('Search for your IOTA name').filter({ visible: true }).click();

        await buyNameFromAvailabilityCheckDialog(page, context, nameToPurchase);

        const normalizedName = normalizeIotaName(nameToPurchase + '.iota', 'at', {
            truncateLongParts: true,
        });
        await expect(page.getByText(`Successfully registered name ${normalizedName}`)).toBeVisible({
            timeout: 30_000,
        });
    });

    test('Navbar search works', async ({ appPage: page }) => {
        // Any page work, but we are testing the other pages already
        await page.getByRole('link', { name: 'Auctions' }).click();

        const nameToPurchase = getPurchaseName();

        await page.getByPlaceholder('Search for your IOTA name').filter({ visible: true }).click();
        await page.getByPlaceholder('Check name availability').fill(nameToPurchase);

        await expect(page.getByText('Available', { exact: true })).toBeVisible();
        await expect(page.getByText(`@${nameToPurchase}`)).toBeVisible({
            timeout: 30_000,
        });
    });

    test('Can renew name from "My Names"', async ({ appPage: page, context }) => {
        await page.getByRole('link', { name: 'My Names' }).click();

        const nameCard = page.getByTestId('name-card').first();

        if (!nameCard) {
            const nameToPurchase = getPurchaseName();

            await page
                .getByPlaceholder('Search for your IOTA name')
                .filter({ visible: true })
                .click();

            await buyNameFromAvailabilityCheckDialog(page, context, nameToPurchase);

            await page.getByTestId('close-icon').click();

            await page.locator('div[data-state=open]').getByRole('button').first().click();
        }

        await nameCard.getByTestId('name-card-avatar').hover();
        const menuButtonLocator = nameCard.getByTestId('menu-button');
        await expect(menuButtonLocator).toBeVisible();

        await menuButtonLocator.click();

        await page.getByText('Renew Name', { exact: true }).click();
        const renewDialog = page.getByRole('dialog');
        await expect(renewDialog.getByText(`Renew Name`)).toBeVisible();

        await page.getByRole('button', { name: 'Renew' }).click();

        (await context.waitForEvent('page')).getByRole('button', { name: 'Approve' }).click();
        await page.bringToFront();
        await expect(page.getByText(`Name renewed successfully`)).toBeVisible({
            timeout: 30_000,
        });
    });
});
