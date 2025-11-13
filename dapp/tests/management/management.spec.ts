// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { formatAddress } from '@iota/iota-sdk/utils';
import { expect } from '@playwright/test';

import { test } from '../helpers/fixtures';
import { purchaseName } from '../helpers/management';
import { connectWallet, createWallet, requestFaucetTokens } from '../utils';

test.describe.configure({ mode: 'parallel' });

test.describe('Management Name Tests', () => {
    let purchasedName: string;
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
        const { name } = await purchaseName();
        purchasedName = name;
    });

    test('purchases a name without errors', async ({ appPage: page, sharedState }) => {
        // Extend timeout to allow a 40s visual pause + network delays
        test.setTimeout(90_000);
        // Navigate to My Names page and verify the purchased name shows up
        await page.goto('/my-names');
        await expect(page.getByText(purchasedName)).toBeVisible({ timeout: 40_000 });
        // Pause to allow manual visual verification in the headed browser (user request)
        await page.waitForTimeout(40_000);
    });
});
