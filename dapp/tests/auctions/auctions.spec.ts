// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { NANOS_PER_IOTA } from '@iota/iota-sdk/utils';

import { buildCreateAuctionTransaction } from '@/auctions';

import { expect, test } from '../helpers/fixtures';
import { iotaClient, iotaNamesClient } from '../setup/utils';
import { connectWallet, createWallet, requestFaucetTokens } from '../utils';

test.describe.parallel('Auction Bid Flow', () => {
    test.beforeAll(async ({ appPage, context, extensionPage, extensionName, sharedState }) => {
        const { address, mnemonic } = await createWallet(extensionPage);

        await appPage.bringToFront();
        await connectWallet(appPage, context, extensionName);

        await requestFaucetTokens(address);
        sharedState.wallet.address = address;
        sharedState.wallet.mnemonic = mnemonic;
    });

    test('transaction to create an auction', async ({ sharedState }) => {
        try {
            let keypair: Ed25519Keypair;
            if (sharedState.wallet.mnemonic) {
                keypair = Ed25519Keypair.deriveKeypair(sharedState.wallet.mnemonic);
            } else {
                keypair = new Ed25519Keypair();
                await requestFaucetTokens(keypair.toIotaAddress());
            }

            const tx = buildCreateAuctionTransaction(
                iotaNamesClient.config.auctionPackageId,
                iotaNamesClient.config.iotaNamesObjectId,
                iotaNamesClient.config.auctionHouseObjectId,
                keypair.toIotaAddress(),
                BigInt(80) * NANOS_PER_IOTA,
                'please.iota',
            );
            console.log('tx', tx);
            const txBytes = await tx.build({
                client: iotaClient,
            });
            const txDryRun = await iotaClient.dryRunTransactionBlock({
                transactionBlock: txBytes,
            });
            if (txDryRun.effects.status.status !== 'success') {
                throw new Error(txDryRun.effects.status.error || 'Transaction dry run failed');
            }
            const response = await iotaClient.signAndExecuteTransaction({
                transaction: txBytes,
                signer: keypair,
            });
            console.log('Transaction sent. Block ID:', response.transaction);
            console.log(JSON.stringify(response, null, 2));
        } catch (error) {
            console.error('Error creating initial auction:', error);
            if (error instanceof Error) console.error(error.stack);
            throw error;
        }
    });

    test('should auction bid again', async ({ appPage: page }) => {
        await page.goto('/auctions', { waitUntil: 'networkidle' });

        const nameCard = page.getByTestId('body-name').filter({ hasText: '@please' });
        await expect(nameCard).toBeVisible({ timeout: 15_000 });

        const bidButton = nameCard.getByRole('button', { name: /Bid/i });
        await bidButton.click();

        const dialog = page.getByRole('dialog');
        await expect(dialog.getByText('Auction', { exact: true })).toBeVisible({ timeout: 15_000 });

        const input = dialog.getByLabel('Your Bid');
        await input.fill('81');

        const bidBtn = page.getByRole('button', { name: /^Bid$/i });
        await expect(bidBtn).toBeVisible();

        const [walletPopup] = await Promise.all([
            page.context().waitForEvent('page'),
            bidBtn.click(),
        ]);

        await walletPopup.waitForLoadState('domcontentloaded');
        const approveBtn = walletPopup.getByRole('button', { name: /^Approve$/i });
        await approveBtn.click();

        await walletPopup.waitForEvent('close', { timeout: 10_000 });
        await expect(page.getByText(/Successfully placed bid of/i)).toBeVisible({
            timeout: 15_000,
        });
    });
});
