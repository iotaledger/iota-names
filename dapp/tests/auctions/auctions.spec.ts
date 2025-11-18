// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { normalizeIotaName } from '@iota/iota-names-sdk';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';

import { denormalizeName } from '@/lib/utils';

import { expect, test } from '../helpers/fixtures';
import {
    connectWallet,
    createAndSendAuctionTransaction,
    createWallet,
    generateRandomName,
    requestFaucetTokens,
} from '../utils';

test.describe.parallel('Auction Bid Flow', () => {
    test.beforeAll(async ({ appPage, context, extensionPage, extensionName, sharedState }) => {
        const { address, mnemonic } = await createWallet(extensionPage);

        await appPage.bringToFront();
        await connectWallet(appPage, context, extensionName);

        await requestFaucetTokens(address);
        sharedState.wallet.address = address;
        sharedState.wallet.mnemonic = mnemonic;
    });

    test('start an aucttion', async ({ appPage: page }) => {
        const auctionName = generateRandomName('auction');
        const displayName = denormalizeName(auctionName);
        const initialSearch = page.getByPlaceholder('Search for your IOTA name');
        await initialSearch.click();

        const searchInput = page.getByPlaceholder('Check name availability');
        await expect(searchInput).toBeVisible({ timeout: 15_000 });

        await searchInput.fill(displayName);
        await page.keyboard.press('Enter');

        const auctionCard = page.getByTestId('auction-card').filter({
            has: page.getByRole('heading', { name: new RegExp(`^${displayName}$`, 'i') }),
        });
        await expect(auctionCard).toBeVisible();

        await auctionCard.hover();
        await auctionCard.getByRole('button', { name: 'Bid' }).click({ timeout: 10_000 });

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
        const nameCard = page.getByTestId('name-card-body').filter({ hasText: displayName });
        await expect(nameCard).toBeVisible({ timeout: 10_000 });

        const bidAgainButton = nameCard.getByRole('button', { name: /Bid Again/i });
        await expect(bidAgainButton).toBeVisible();
    });

    test('create bid on existing auction', async ({ appPage: page, context }) => {
        const auctionName = generateRandomName('existing');

        const keypair = new Ed25519Keypair();
        await requestFaucetTokens(keypair.toIotaAddress());

        const response = await createAndSendAuctionTransaction({
            signer: keypair,
            name: auctionName,
        });

        expect(response.effects?.status.status).toBe('success');

        await page.goto(`/auctions?page=1&search=${auctionName}`);
        await page.getByTestId('refresh-button').click({ timeout: 10_000 });

        await expect(page.getByText(/Refreshed successfully!/i)).toBeVisible({
            timeout: 10_000,
        });

        const displayName = normalizeIotaName(auctionName, 'at');

        const nameCard = page.getByTestId('name-card-body').filter({ hasText: displayName });
        await expect(nameCard).toBeVisible({ timeout: 10_000 });

        await nameCard.getByRole('button', { name: /Bid/i }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByText('Auction', { exact: true })).toBeVisible({ timeout: 15_000 });
        await page.getByRole('button', { name: /^Bid$/i }).click();
        const walletConfirmationPage = context.waitForEvent('page');
        const walletPopup = await walletConfirmationPage;

        await walletPopup.waitForLoadState('domcontentloaded');
        const approveBtn = walletPopup.getByRole('button', { name: /^Approve$/i });
        await approveBtn.click();

        await walletPopup.waitForEvent('close', { timeout: 10_000 });
        await expect(page.getByText(/Successfully placed bid of/i)).toBeVisible({
            timeout: 5_000,
        });
    });
});
