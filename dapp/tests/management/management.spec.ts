// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { formatAddress } from '@iota/iota-sdk/utils';
import { expect } from '@playwright/test';

import { test } from '../helpers/fixtures';
import { purchaseName } from '../helpers/management';
import { connectWallet, createWallet, requestFaucetTokens } from '../utils';

test.describe.configure({ mode: 'parallel' });

test.describe('Management Name Tests', () => {
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

    test('purchases a name without errors', async ({ appPage: page, context, sharedState }) => {
        await purchaseName(page, context);
        await page.goto('/my-names');
        const nameCards = page.getByTestId('name-card');
        await expect(nameCards.first()).toBeVisible({ timeout: 30_000 });
    });
});
