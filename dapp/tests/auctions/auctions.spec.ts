// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { normalizeIotaName } from '@iota/iota-names-sdk';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';

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

    test('create bid on existing auction', async ({ appPage: page }) => {
        const auctionName = generateRandomName('existing');

        const keypair = new Ed25519Keypair();
        await requestFaucetTokens(keypair.toIotaAddress());

        const response = await createAndSendAuctionTransaction({
            signer: keypair,
            name: auctionName,
        });

        expect(response.effects?.status.status).toBe('success');

        await page.goto(`/auctions?page=1&search=${auctionName}`);
        const refreshContainer = page.getByTestId('auctions-refresh-container');
        await expect(refreshContainer).toBeVisible({ timeout: 10_000 });
        const refreshButton = refreshContainer.getByRole('button');
        await refreshButton.click();
        await expect(page.getByText(/Refreshed successfully!/i)).toBeVisible({
            timeout: 10_000,
        });

        const displayName = normalizeIotaName(auctionName, 'at');

        const nameCard = page.getByTestId('body-name').filter({ hasText: displayName });
        await expect(nameCard).toBeVisible({ timeout: 10_000 });

        const bidButton = nameCard.getByRole('button', { name: /Bid/i });
        await bidButton.click();

        const dialog = page.getByRole('dialog');
        await expect(dialog.getByText('Auction', { exact: true })).toBeVisible({ timeout: 15_000 });

        const bidBtn = page.getByRole('button', { name: /^Bid$/i });
        await expect(bidBtn).toBeVisible();

        const waitForWalletPopup = page.context().waitForEvent('page');
        await bidBtn.click();
        const walletPopup = await waitForWalletPopup;

        await walletPopup.waitForLoadState('domcontentloaded');
        const approveBtn = walletPopup.getByRole('button', { name: /^Approve$/i });
        await approveBtn.click();

        await walletPopup.waitForEvent('close', { timeout: 10_000 });
        await expect(page.getByText(/Successfully placed bid of/i)).toBeVisible({
            timeout: 5_000,
        });
    });
});
