// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { formatAddress } from '@iota/iota-sdk/utils';
import { expect } from '@playwright/test';

import { denormalizeName } from '@/lib/utils';

import { test } from '../helpers/fixtures';
import { connectWallet, createWallet, requestFaucetTokens } from '../utils';

test.describe.parallel('Purchase Name Tests', () => {
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

    test('Unavailable shows up for already purchased name', async ({ appPage: page }) => {
        // Name bought when initializing localnet with scripts/tests/register-name.ts
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
