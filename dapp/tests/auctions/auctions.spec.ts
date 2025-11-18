// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import 'dotenv/config';

import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { formatAddress } from '@iota/iota-sdk/utils';

import { expect, test } from '../helpers/fixtures';
import {
    bidOnExistingAuction,
    connectWallet,
    createAndSendAuctionTransaction,
    createWallet,
    generateRandomName,
    requestFaucetTokens,
} from '../utils';
import { checkAuctionPills } from './auction.utils';

test.beforeAll(async ({ appPage, context, extensionPage, extensionName, sharedState }) => {
    const { address, mnemonic } = await createWallet(extensionPage);

    await appPage.bringToFront();

    await connectWallet(appPage, context, extensionName);

    await expect(appPage.getByRole('button', { name: formatAddress(address) })).toBeVisible({
        timeout: 10_000,
    });

    sharedState.wallet.address = address;
    sharedState.wallet.mnemonic = mnemonic;
});

test('Check "Outbid" pills', async ({ sharedState, appPage: page }) => {
    const name = generateRandomName('outbid');

    const walletSigner = Ed25519Keypair.deriveKeypair(sharedState.wallet.mnemonic!);
    const newSigner = Ed25519Keypair.deriveKeypair(
        sharedState.wallet.mnemonic!,
        `m/44'/4218'/0'/0'/1'`,
    );

    await Promise.all([
        requestFaucetTokens(walletSigner.toIotaAddress()),
        requestFaucetTokens(newSigner.toIotaAddress()),
    ]);

    const startAuctionResult = await createAndSendAuctionTransaction({
        name,
        signer: walletSigner,
    });
    expect(startAuctionResult.effects?.status.status).toBe('success');

    const bidResult = await bidOnExistingAuction({
        name,
        signer: newSigner,
    });
    expect(bidResult.effects?.status.status).toBe('success');

    await checkAuctionPills(page, name, 'Outbid');
});

test('Check "Top Bidder" pills', async ({ sharedState, appPage: page }) => {
    const name = generateRandomName('topbid');

    const walletSigner = Ed25519Keypair.deriveKeypair(sharedState.wallet.mnemonic!);

    await requestFaucetTokens(walletSigner.toIotaAddress());

    const startAuctionResult = await createAndSendAuctionTransaction({
        name,
        signer: walletSigner,
    });
    expect(startAuctionResult.effects?.status.status).toBe('success');

    await checkAuctionPills(page, name, 'Top Bidder');
});
