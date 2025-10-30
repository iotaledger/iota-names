// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from './helpers/fixtures';
import { connectWallet, createWallet, requestFaucetTokensOnWalletHome } from './utils';

test.describe.serial('Auction Bid Flow', () => {
    test.setTimeout(20_000);

    test.beforeAll(async ({ context, sharedState, extensionName, appPage }) => {
        const extensionPage = await context.newPage();
        await appPage.goto('/', { waitUntil: 'commit' });

        const { address, mnemonic } = await createWallet(extensionPage);
        await requestFaucetTokensOnWalletHome(extensionPage, address);

        await appPage.bringToFront();

        await connectWallet(appPage, context, extensionName);

        sharedState.wallet.address = address;
        sharedState.wallet.mnemonic = mnemonic;
    });

    test('should display name card and open auction dialog', async ({ appPage: page }) => {
        const randomSuffix = Math.floor(Math.random() * 10000); // 0–9999
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

    test('should auction bid again', async ({ appPage: page }) => {
        await page.goto('/auctions', { waitUntil: 'networkidle' });
        const buttonBidAgain = page.getByRole('button', { name: /Bid Again/i });
        await buttonBidAgain.click();
        const dialog = page.getByRole('dialog');

        await expect(dialog.getByText('Auction', { exact: true })).toBeVisible({ timeout: 15_000 });
        const input = dialog.getByLabel('Your Bid');
        await expect(input).toBeVisible({ timeout: 10_000 });
        await input.fill('53');
        const bidBtn = page.getByRole('button', { name: /^Bid$/i });
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

    test('should allow claiming after auction ends', async ({ appPage: page }) => {
        await page.goto('/my-names');

        const claimButton = page.getByRole('button', { name: /Claim/i });
        await expect(claimButton).toBeVisible({ timeout: 15_000 });
        const [walletPopup] = await Promise.all([
            page.context().waitForEvent('page'),
            claimButton.click(),
        ]);

        await walletPopup.waitForLoadState('domcontentloaded');

        const approveBtn = walletPopup.getByRole('button', { name: /^Approve$/i });
        await expect(approveBtn).toBeVisible({ timeout: 10_000 });
        await approveBtn.click();

        await walletPopup.waitForEvent('close', { timeout: 10_000 });
    });
});
