// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import 'dotenv/config';

import { normalizeIotaName } from '@iota/iota-names-sdk';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { formatAddress } from '@iota/iota-sdk/utils';
import { expect } from '@playwright/test';

import { test } from '../helpers/fixtures';
import {
    bidOnExistingAuction,
    connectWallet,
    createAndSendAuctionTransaction,
    createWallet,
    requestFaucetTokens,
} from '../utils';

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
    const name = `outbid${Date.now().toString().slice(-6)}`;
    const nameToAuction = `${name}.iota`;
    await page.bringToFront();
    const navPromise = page.goto(`/my-names`);

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
        name: nameToAuction,
        signer: walletSigner,
    });
    expect(startAuctionResult.effects?.status.status).toBe('success');

    const bidResult = await bidOnExistingAuction({
        name: nameToAuction,
        signer: newSigner,
    });
    expect(bidResult.effects?.status.status).toBe('success');

    await navPromise;
    await page.locator("h2:has-text('My Names')").waitFor({ state: 'visible', timeout: 10_000 });

    await page.getByTestId('refresh-button').click();
    await page.getByText('Refreshed successfully!').waitFor({ state: 'visible', timeout: 10_000 });

    const auctionNameCard = page
        .getByTestId('auction-name-card')
        .filter({ hasText: normalizeIotaName(nameToAuction, 'at') });

    await expect(auctionNameCard.getByTestId('auction-status-badge')).toHaveText('Outbid', {
        timeout: 10_000,
    });
});

test('Check "Top Bidder" pills', async ({ sharedState, appPage: page, context }) => {
    const name = `topbid${Date.now().toString().slice(-6)}`;
    const nameToAuction = `${name}.iota`;
    await page.bringToFront();
    const navPromise = page.goto(`/my-names`);

    const walletSigner = Ed25519Keypair.deriveKeypair(sharedState.wallet.mnemonic!);

    await requestFaucetTokens(walletSigner.toIotaAddress());

    const startAuctionResult = await createAndSendAuctionTransaction({
        name: nameToAuction,
        signer: walletSigner,
    });
    expect(startAuctionResult.effects?.status.status).toBe('success');

    await navPromise;
    await page.locator("h2:has-text('My Names')").waitFor({ state: 'visible', timeout: 10_000 });

    await page.getByTestId('refresh-button').click();
    await page.getByText('Refreshed successfully!').waitFor({ state: 'visible', timeout: 10_000 });

    const auctionNameCard = page
        .getByTestId('auction-name-card')
        .filter({ hasText: normalizeIotaName(nameToAuction, 'at') });

    await expect(auctionNameCard.getByTestId('auction-status-badge')).toHaveText('Top Bidder', {
        timeout: 10_000,
    });

    await page.getByRole('link', { name: 'Auctions' }).click();
    await page.getByPlaceholder('Search auction').fill(nameToAuction);
    const auctionCard = page.getByTestId('auction-name-card').filter({
        hasText: normalizeIotaName(nameToAuction, 'at'),
    });

    await expect(auctionCard).toBeVisible({ timeout: 10_000 });
    await expect(auctionCard.getByTestId('auction-status-badge')).toHaveText('Top Bidder', {
        timeout: 10_000,
    });

    await page.getByLabel('Go to homepage').filter({ visible: true }).first().click();
    await page.getByText('Live Auctions').scrollIntoViewIfNeeded();

    const carousel = page.getByTestId('auction-carousel');
    const auctionInCarousel = carousel.getByTestId('auction-name-card').filter({
        hasText: normalizeIotaName(nameToAuction, 'at'),
    });
    await expect(auctionInCarousel.getByTestId('auction-status-badge')).toHaveText('Top Bidder', {
        timeout: 10_000,
    });
});
