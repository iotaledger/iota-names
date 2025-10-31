// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { normalizeIotaName } from '@iota/iota-names-sdk';
import { formatAddress } from '@iota/iota-sdk/utils';
import { expect } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';

import { test } from '../helpers/fixtures';
import { buyNameFromAvailabilityCheckDialog, purchaseNameFactory } from '../helpers/helpers';
import {
    connectWallet,
    createWallet,
    getAddressByIndexPath,
    requestFaucetTokensOnWalletHome,
} from '../utils';

test.describe('Management Flow', () => {
    test.setTimeout(60_000);
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

        await appPage.close();
    });

    test('Purchase name from Home', async ({ appPage: page, context }) => {
        const nameToPurchase = getPurchaseName();

        await page.getByPlaceholder('Search for your IOTA name').click();

        await buyNameFromAvailabilityCheckDialog(page, context, nameToPurchase);

        const normalizedName = normalizeIotaName(nameToPurchase + '.iota', 'at', {
            truncateLongParts: true,
        });
        await expect(page.getByText(`Successfully registered name ${normalizedName}`)).toBeVisible({
            timeout: 30_000,
        });

        await page.close();
    });

    // Helper to ensure there's at least one owned name to manage
    async function ensureOwnedName(page: Page, context: BrowserContext) {
        await page.getByRole('link', { name: 'My Names' }).click();
        const count = await page.getByTestId('name-card').count();
        if (count === 0) {
            const nameToPurchase = getPurchaseName();
            await page.getByPlaceholder('Search for your IOTA name').click();
            await buyNameFromAvailabilityCheckDialog(page, context, nameToPurchase);
            // Close purchase dialog if still open
            const closeIcon = page.getByTestId('close-icon');
            if (await closeIcon.isVisible().catch(() => false)) {
                await closeIcon.click();
            }
        }
    }

    test('Add a subname', async ({ appPage: page, context }) => {
        await ensureOwnedName(page, context);

        const nameCard = page.getByTestId('name-card').first();
        await nameCard.getByTestId('name-card-avatar').hover();
        const menuButtonLocator = nameCard.getByTestId('menu-button');
        await expect(menuButtonLocator).toBeVisible();
        await menuButtonLocator.click();

        await page.getByText('Create Subname', { exact: true }).click();

        const dialog = page.getByRole('dialog');
        await expect(dialog.getByText('New Subname')).toBeVisible();

        const subname = 'sub-' + Math.floor(Math.random() * 1000);
        await dialog.getByPlaceholder('Enter subname').fill(subname);

        await dialog.getByRole('button', { name: 'Create' }).click();
        (await context.waitForEvent('page')).getByRole('button', { name: 'Approve' }).click();
        await page.bringToFront();

        await expect(page.getByText('Successfully created subname', { exact: false })).toBeVisible({
            timeout: 30_000,
        });

        await page.close();
    });

    test('Connect address', async ({ appPage: page, context, sharedState }) => {
        await ensureOwnedName(page, context);

        const nameCard = page.getByTestId('name-card').first();
        await nameCard.getByTestId('name-card-avatar').hover();
        const menuButtonLocator = nameCard.getByTestId('menu-button');
        await expect(menuButtonLocator).toBeVisible();
        await menuButtonLocator.click();

        await page.getByText('Connect to Address', { exact: true }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByText('Connect to Address')).toBeVisible();

        // Use a different valid IOTA address derived from the same mnemonic
        const mnemonic = sharedState.wallet.mnemonic as string;
        const externalAddress = getAddressByIndexPath(mnemonic, 1);

        await dialog.getByPlaceholder('Enter Address').fill(externalAddress);
        await dialog.getByRole('button', { name: 'Apply' }).click();
        (await context.waitForEvent('page')).getByRole('button', { name: 'Approve' }).click();
        await page.bringToFront();

        await expect(page.getByText('Successfully connected', { exact: false })).toBeVisible({
            timeout: 30_000,
        });

        await page.close();
    });

    test('Add an avatar', async ({ appPage: page, context }) => {
        await ensureOwnedName(page, context);

        const nameCard = page.getByTestId('name-card').first();
        await nameCard.getByTestId('name-card-avatar').hover();
        const menuButtonLocator = nameCard.getByTestId('menu-button');
        await expect(menuButtonLocator).toBeVisible();
        await menuButtonLocator.click();

        await page.getByText('Personalize Avatar', { exact: true }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByText('Personalize Avatar')).toBeVisible();

        const noAssets = await dialog
            .getByText('No Eligible NFTs', { exact: true })
            .isVisible()
            .catch(() => false);

        if (noAssets) {
            // Nothing to personalize; just close dialog gracefully
            await dialog.getByRole('button', { name: 'Cancel' }).click();
        } else {
            // Click the first visual asset card (generic fallback)
            const gridContainer = dialog.locator('div.grid').first();
            const firstCard = gridContainer.locator('div').first();
            await firstCard.click();
            await dialog.getByRole('button', { name: 'Save' }).click();
            (await context.waitForEvent('page')).getByRole('button', { name: 'Approve' }).click();
            await page.bringToFront();

            await expect(
                page.getByText('Successfully updated avatar for', { exact: false }),
            ).toBeVisible({ timeout: 30_000 });
        }

        await page.close();
    });

    test('Edit metadata', async ({ appPage: page, context }) => {
        await ensureOwnedName(page, context);

        const nameCard = page.getByTestId('name-card').first();
        await nameCard.getByTestId('name-card-avatar').hover();
        const menuButtonLocator = nameCard.getByTestId('menu-button');
        await expect(menuButtonLocator).toBeVisible();
        await menuButtonLocator.click();

        await page.getByText('Edit Metadata', { exact: true }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByText('Edit Metadata')).toBeVisible();

        // Select Website metadata and set a simple valid value
        await dialog.getByRole('button', { name: 'Website' }).click();
        await dialog.getByLabel('Website').fill('example.com');

        await dialog.getByRole('button', { name: 'Apply' }).click();
        (await context.waitForEvent('page')).getByRole('button', { name: 'Approve' }).click();
        await page.bringToFront();

        await expect(
            page.getByText('Successfully updated metadata for', { exact: false }),
        ).toBeVisible({ timeout: 30_000 });

        await page.close();
    });

    test('View info', async ({ appPage: page, context }) => {
        await ensureOwnedName(page, context);

        const nameCard = page.getByTestId('name-card').first();
        await nameCard.getByTestId('name-card-avatar').hover();
        const menuButtonLocator = nameCard.getByTestId('menu-button');
        await expect(menuButtonLocator).toBeVisible();
        await menuButtonLocator.click();

        await page.getByText('View All Info', { exact: true }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByText('General Info')).toBeVisible();

        await expect(dialog.getByText('Owner', { exact: false })).toBeVisible();
        await expect(dialog.getByText('Expiration Time', { exact: false })).toBeVisible();

        // Close dialog
        const closeIcon = page.getByTestId('close-icon');
        if (await closeIcon.isVisible().catch(() => false)) {
            await closeIcon.click();
        }

        await page.close();
    });
});
