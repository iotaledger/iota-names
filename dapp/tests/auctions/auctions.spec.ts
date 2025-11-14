// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import 'dotenv/config';

import { normalizeIotaName } from '@iota/iota-names-sdk';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { formatAddress, NANOS_PER_IOTA } from '@iota/iota-sdk/utils';
import { expect } from '@playwright/test';

import { buildCreateAuctionTransaction } from '@/auctions';

import { test } from '../helpers/fixtures';
import { iotaClient, iotaNamesClient } from '../setup/utils';
import { connectWallet, createWallet, requestFaucetTokens } from '../utils';

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

test('Claim an auction', async ({ sharedState, appPage: page, context }) => {
    test.setTimeout(60_000);
    const name = `claim${Date.now().toString().slice(-6)}`;
    const nameToAuction = `${name}.iota`;
    await page.bringToFront();
    const navPromise = page.goto(`/auctions?page=1&search=${name}`);

    let keypair: Ed25519Keypair;
    if (sharedState.wallet.mnemonic) {
        keypair = Ed25519Keypair.deriveKeypair(sharedState.wallet.mnemonic);
    } else {
        keypair = new Ed25519Keypair();
    }

    await requestFaucetTokens(keypair.toIotaAddress());
    const tx = buildCreateAuctionTransaction(
        iotaNamesClient.config.auctionPackageId,
        iotaNamesClient.config.iotaNamesObjectId,
        iotaNamesClient.config.auctionHouseObjectId,
        keypair.toIotaAddress(),
        BigInt(50) * NANOS_PER_IOTA,
        nameToAuction,
    );

    const txBuild = await tx.build({
        client: iotaClient,
    });

    const result = await iotaClient.signAndExecuteTransaction({
        transaction: txBuild,
        signer: keypair,
        options: {
            showEffects: true,
            showObjectChanges: true,
            showEvents: true,
        },
    });

    expect(result.effects?.status.status).toBe('success');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await navPromise;
    await page.locator("h2:has-text('Auctions')").waitFor({ state: 'visible', timeout: 10_000 });

    await page.getByTestId('refresh-button').click();
    await page.getByText('Refreshed successfully!').waitFor({ state: 'visible', timeout: 10_000 });

    let auctionNameCard = page
        .getByTestId('auction-name-card')
        .filter({ hasText: normalizeIotaName(nameToAuction, 'at') });

    const timeRemainingLocator = auctionNameCard.getByTestId('auction-time-remaining');
    const textContent = await timeRemainingLocator.textContent();
    const secondsRemaining = Number(textContent?.replace('s', '').trim()) || 0;
    const offsetSeconds = 2;

    await new Promise((resolve) => setTimeout(resolve, (offsetSeconds + secondsRemaining) * 1000));

    await expect(timeRemainingLocator).toHaveText('Finished', { timeout: 10_000 });

    await page.getByTestId('refresh-button').click();
    await page.getByText('Refreshed successfully!').waitFor({ state: 'visible', timeout: 10_000 });

    auctionNameCard = page
        .getByTestId('auction-name-card')
        .filter({ hasText: normalizeIotaName(nameToAuction, 'at') });

    const claimButton = auctionNameCard.getByRole('button', { name: 'Claim' });
    await expect(claimButton).toBeEnabled({
        timeout: 10_000,
    });

    await claimButton.click();

    const approvePage = await context.waitForEvent('page', { timeout: 10_000 });

    await approvePage.waitForLoadState();
    await approvePage.bringToFront();
    await approvePage
        .getByText('Do you approve these actions?')
        .waitFor({ state: 'visible', timeout: 10_000 });

    await approvePage.getByRole('button', { name: 'Approve' }).click();
    await approvePage.waitForEvent('close', { timeout: 10_000 });
    await page.bringToFront();

    await expect(auctionNameCard.getByRole('button', { name: 'Claiming...' })).toBeVisible({
        timeout: 5_000,
    });

    await expect(auctionNameCard.getByText('Claimed')).toBeVisible({
        timeout: 20_000,
    });
});
