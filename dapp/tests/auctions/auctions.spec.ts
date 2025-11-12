// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { formatAddress } from '@iota/iota-sdk/utils';

import { expect, test } from '../helpers/fixtures';
import { connectWallet, createWallet, requestFaucetTokens } from '../utils';

test.describe('Auction Name Tests', () => {
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

    test('should display name card and open auction dialog', async ({ appPage: page }) => {
        const randomSuffix = Math.floor(Math.random() * 10000);
        const exampleName = `example${randomSuffix}`;
        const initialSearch = page.getByPlaceholder('Search for your IOTA name');
        await initialSearch.click();

        const searchInput = page.getByPlaceholder('Check name availability');
        await expect(searchInput).toBeVisible({ timeout: 15_000 });

        await searchInput.fill(exampleName);
        await page.keyboard.press('Enter');

        const auctionCards = page.getByTestId('auction-card');
        await expect(auctionCards.first()).toBeVisible({ timeout: 15_000 });

        const exampleCard = auctionCards.filter({
            has: page.getByRole('heading', { name: new RegExp(`^${exampleName}$`, 'i') }),
        });
        await expect(exampleCard).toBeVisible();

        await exampleCard.hover();
        const bidButton = exampleCard.locator('button:has-text("Bid")');
        await bidButton.waitFor({ state: 'visible', timeout: 10_000 });
        await bidButton.click();

        const dialog = page.getByRole('dialog').last();

        await expect(dialog.getByText('Auction', { exact: true })).toBeVisible({ timeout: 15_000 });
        const input = dialog.getByLabel('Your Bid');
        await expect(input).toBeVisible({ timeout: 10_000 });
        await input.fill('52');
        const bidBtn = page.getByRole('button', { name: /^Start auction$/i });
        await expect(bidBtn).toBeVisible();
        const [walletPopup] = await Promise.all([
            page.context().waitForEvent('page'),
            bidBtn.click(),
        ]);

        await walletPopup.waitForLoadState('domcontentloaded');

        const approveBtn = walletPopup.getByRole('button', { name: /^Approve$/i });
        await expect(approveBtn).toBeVisible({ timeout: 10_000 });
        await approveBtn.click();

        await walletPopup.waitForEvent('close', { timeout: 10_000 });
        await expect(page.getByText(/Successfully placed bid of/i)).toBeVisible({
            timeout: 15_000,
        });
    });
});
