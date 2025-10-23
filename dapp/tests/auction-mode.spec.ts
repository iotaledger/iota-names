// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from './helpers/fixtures';
import { connectWallet, createWallet, requestFaucetTokensOnWalletHome } from './utils';

test.describe.serial('Auction Bid Flow', () => {
    test.setTimeout(20_000);

    test.beforeAll(async ({ context, extensionUrl, sharedState, extensionName, appPage }) => {
        const extensionPage = await context.newPage();
        await extensionPage.goto(extensionUrl);

        const { address, mnemonic } = await createWallet(extensionPage, extensionUrl);
        await requestFaucetTokensOnWalletHome(extensionPage, address);

        await appPage.bringToFront();

        await connectWallet(appPage, context, extensionName);

        sharedState.wallet.address = address;
        sharedState.wallet.mnemonic = mnemonic;
    });

    test('should display name card and open auction dialog', async ({ appPage: page }) => {
        const initialSearch = page.getByPlaceholder('Search for your IOTA name');
        await initialSearch.click();

        const searchInput = page.getByPlaceholder('Check name availability');
        await expect(searchInput).toBeVisible({ timeout: 15_000 });

        await searchInput.fill('example1');
        await page.keyboard.press('Enter');

        const auctionCards = page.getByTestId('auction-card');
        await expect(auctionCards.first()).toBeVisible({ timeout: 15_000 });

        const exampleCard = auctionCards.filter({
            has: page.getByRole('heading', { name: /^example1$/i }),
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
        await input.fill('200');
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
        const bidCard = page.getByText('example1', { exact: true });
        await expect(bidCard).toBeVisible({ timeout: 15_000 });

        const buttonBidAgain = bidCard.getByRole('button', { name: /Bid Again/i });
        await buttonBidAgain.click();
        const dialog = page.getByRole('dialog');

        await expect(dialog.getByText('Auction', { exact: true })).toBeVisible({ timeout: 15_000 });
        const input = dialog.getByLabel('Your Bid');
        await expect(input).toBeVisible({ timeout: 10_000 });
        await input.fill('202');
        const bidBtn = page.getByRole('button', { name: /^Start auction$/i });
        await bidBtn.click();
    });

    // test('should allow claiming after auction ends', async ({ appPage: page }) => {
    //     await page.goto('/name/example', { waitUntil: 'networkidle' });

    //     // await page.evaluate(() => window.__debug_endAuction?.());

    //     const claimButton = page.getByRole('button', { name: /Claim/i });
    //     await expect(claimButton).toBeVisible({ timeout: 15_000 });

    //     await claimButton.click();

    //     await expect(page.getByText(/You own this name|Claim successful/i)).toBeVisible({
    //         timeout: 30_000,
    //     });
    // });
});
