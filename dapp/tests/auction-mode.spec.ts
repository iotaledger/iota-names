// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from './helpers/fixtures';
import { createWallet, requestFaucetTokensOnWalletHome } from './utils';

test.describe.serial('Auction Bid Flow', () => {
    test.setTimeout(20_000);

    test.beforeAll(async ({ context, extensionUrl, sharedState }) => {
        const extensionPage = await context.newPage();
        await extensionPage.goto(extensionUrl);

        const { address, mnemonic } = await createWallet(extensionPage, extensionUrl);
        await requestFaucetTokensOnWalletHome(extensionPage, address);

        const namesPage = await context.newPage();
        await namesPage.goto('/');

        sharedState.wallet.address = address;
        sharedState.wallet.mnemonic = mnemonic;
    });

    test('should display name card after searching', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });

        const searchInput = page.getByPlaceholder('Check name availability');
        await expect(searchInput).toBeVisible({ timeout: 15_000 });

        await searchInput.fill('example');

        await page.keyboard.press('Enter');

        await expect(page.getByText(/example\.iota/i)).toBeVisible({ timeout: 15_000 });
    });

    test('should open auction dialog when clicking Bid', async ({ page }) => {
        const bidButton = page.getByRole('button', { name: /^Bid$/i });
        await expect(bidButton).toBeVisible({ timeout: 15_000 });

        await bidButton.click();

        await expect(page.getByRole('heading', { name: 'Auction' })).toBeVisible({
            timeout: 10_000,
        });
    });

    test('should allow placing a bid inside the dialog', async ({ page }) => {
        const input = page.getByLabel('Your Bid'); // label visible del input
        await expect(input).toBeVisible({ timeout: 10_000 });

        await input.fill('200');

        const bidBtn = page.getByRole('button', { name: /^Bid$/i });
        await expect(bidBtn).toBeVisible();

        await bidBtn.click();

        await expect(page.getByText(/Successfully placed bid/i)).toBeVisible({ timeout: 30_000 });
    });

    test('should allow claiming after auction ends', async ({ page }) => {
        await page.goto('/name/example', { waitUntil: 'networkidle' });

        // await page.evaluate(() => window.__debug_endAuction?.());

        const claimButton = page.getByRole('button', { name: /Claim/i });
        await expect(claimButton).toBeVisible({ timeout: 15_000 });

        await claimButton.click();

        await expect(page.getByText(/You own this name|Claim successful/i)).toBeVisible({
            timeout: 30_000,
        });
    });
});
