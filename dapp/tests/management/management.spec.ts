// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { normalizeIotaName } from '@iota/iota-names-sdk';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { formatAddress } from '@iota/iota-sdk/utils';

import { expect, test } from '../helpers/fixtures';
import { iotaNamesClient } from '../setup/utils';
import {
    addSubnameName,
    connectWallet,
    createWallet,
    editSetup,
    generateRandomName,
    generateRandomSubname,
    purchaseName,
    requestFaucetTokens,
} from '../utils';

test.describe.parallel('Name Management Tests', () => {
    // Increase timeout for slower subname permission flows
    test.setTimeout(45_000);
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

    test('Can not add subname to a subname due permissions', async ({
        appPage: page,
        sharedState,
    }) => {
        const keypair = Ed25519Keypair.deriveKeypair(sharedState.wallet.mnemonic ?? '');
        const name = generateRandomName('display');
        const subname = generateRandomSubname('subname', name);
        const responsePurchase = await purchaseName(
            name,
            sharedState.wallet.address ?? '',
            keypair,
        );
        expect(responsePurchase.effects?.status.status).toBe('success');

        const record = await iotaNamesClient.getNameRecord(name);
        if (!record) throw new Error('Name record not found');

        const responsePurchaseSubname = await addSubnameName(
            subname,
            record.nftId,
            record.expirationDate,
            sharedState.wallet.address ?? '',
            keypair,
        );
        expect(responsePurchaseSubname.effects?.status.status).toBe('success');

        const responseEditSetup = await editSetup(
            subname,
            record.nftId,
            false,
            false,
            sharedState.wallet.address ?? '',
            keypair,
        );
        expect(responseEditSetup.effects?.status.status).toBe('success');

        await page.goto('/my-names');
        await expect(
            page.getByTestId('name-card').filter({ hasText: normalizeIotaName(subname, 'at') }),
        ).toBeVisible({ timeout: 10_000 });

        const nameCard = page
            .getByTestId('name-card')
            .filter({ hasText: normalizeIotaName(subname, 'at') });

        await nameCard.getByTestId('name-card-avatar').hover();
        const menuButtonLocator = nameCard.getByTestId('menu-button');
        await expect(menuButtonLocator).toBeVisible();
        await menuButtonLocator.click();

        await expect(page.getByText('Create Subname', { exact: true })).toHaveCount(0);
        await page.close();
    });
});
