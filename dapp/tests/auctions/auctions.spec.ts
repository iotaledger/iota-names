// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { formatAddress } from '@iota/iota-sdk/utils';

import { denormalizeName } from '@/lib/utils';

import { expect, test } from '../helpers/fixtures';
import { connectWallet, createWallet, generateRandomName, requestFaucetTokens } from '../utils';

test.describe.parallel('Auction Bid Flow', () => {
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

    test('start an aucttion', async ({ appPage: page }) => {
        const auctionName = generateRandomName('auction');
        const displayName = denormalizeName(auctionName);
        console.log('displayName', displayName);
        const initialSearch = page.getByPlaceholder('Search for your IOTA name');
        await initialSearch.click();

        const searchInput = page.getByPlaceholder('Check name availability');
        await expect(searchInput).toBeVisible({ timeout: 15_000 });

        await searchInput.fill(displayName);
        await page.keyboard.press('Enter');

        const auctionCards = page.getByTestId('auction-card');
        await expect(auctionCards.first()).toBeVisible({ timeout: 15_000 });

        const exampleCard = auctionCards.filter({
            has: page.getByRole('heading', { name: new RegExp(`^${displayName}$`, 'i') }),
        });
        console.log('example', exampleCard);
        await expect(exampleCard).toBeVisible();

        await exampleCard.hover();
        const bidButton = exampleCard.locator('button:has-text("Bid")');
        await bidButton.waitFor({ state: 'visible', timeout: 10_000 });
        await bidButton.click();

        const dialog = page.getByRole('dialog').last();

        await expect(dialog.getByText('Auction', { exact: true })).toBeVisible({ timeout: 10_000 });
        const bidBtn = page.getByRole('button', { name: /^Start auction$/i });
        await expect(bidBtn).toBeVisible();
        const waitForWalletPopup = page.context().waitForEvent('page');
        await bidBtn.click();
        const walletPopup = await waitForWalletPopup;

        await walletPopup.waitForLoadState('domcontentloaded');

        const approveBtn = walletPopup.getByRole('button', { name: /^Approve$/i });
        await expect(approveBtn).toBeVisible({ timeout: 10_000 });
        await approveBtn.click();

        await walletPopup.waitForEvent('close', { timeout: 10_000 });
        await expect(page.getByText(/Successfully placed bid of/i)).toBeVisible({
            timeout: 15_000,
        });
        await page.goto(`/auctions?page=1&search=${displayName}`);
        const nameCard = page.getByTestId('body-name').filter({ hasText: displayName });
        await expect(nameCard).toBeVisible({ timeout: 10_000 });

        const bidAgainButton = nameCard.getByRole('button', { name: /Bid Again/i });
        await expect(bidAgainButton).toBeVisible();
    });
});
