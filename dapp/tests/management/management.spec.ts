// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { normalizeIotaName } from '@iota/iota-names-sdk';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { formatAddress } from '@iota/iota-sdk/utils';

import { expect, test } from '../helpers/fixtures';
import { iotaNamesClient } from '../setup/utils';
import {
    connectName,
    connectWallet,
    createWallet,
    generateRandomName,
    purchaseName,
    requestFaucetTokens,
    setDisplayName,
} from '../utils';

test.describe.parallel('Name Management Tests', () => {
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
    test('Unset Display', async ({ appPage: page, context, sharedState }) => {
        const keypair = Ed25519Keypair.deriveKeypair(sharedState.wallet.mnemonic ?? '');
        const name = generateRandomName('display');
        const address = sharedState.wallet.address ?? '';

        const responsePurchase = await purchaseName(
            name,
            sharedState.wallet.address ?? '',
            keypair,
        );
        expect(responsePurchase.effects?.status.status).toBe('success');

        const record = await iotaNamesClient.getNameRecord(name);
        if (!record) throw new Error('Name record not found');

        const responseConnect = await connectName(name, address, record.nftId, keypair);
        expect(responseConnect.effects?.status.status).toBe('success');

        const responseSetDisplay = await setDisplayName(name, address, keypair);
        expect(responseSetDisplay.effects?.status.status).toBe('success');

        await page.waitForTimeout(3_000);
        await page.goto('/my-names');
        await page.reload();
        await expect(
            page.getByTestId('name-card').filter({ hasText: normalizeIotaName(name, 'at') }),
        ).toBeVisible({ timeout: 10_000 });

        const nameCard = page
            .getByTestId('name-card')
            .filter({ hasText: normalizeIotaName(name, 'at') });

        await nameCard.getByTestId('name-card-avatar').hover();
        const menuButtonLocator = nameCard.getByTestId('menu-button');
        await expect(menuButtonLocator).toBeVisible();
        await menuButtonLocator.click();

        await page.getByText('Connect to Address', { exact: true }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByText('Connect to Address')).toBeVisible();

        await expect(dialog.getByText('Set as Display name')).toBeVisible();
        await dialog.getByText('Set as Display name').click();

        await dialog.getByRole('button', { name: 'Apply' }).click();
        (await context.waitForEvent('page')).getByRole('button', { name: 'Approve' }).click();
        await page.bringToFront();

        await dialog.getByRole('button', { name: 'Finish' }).click();
        await page.close();
    });
});
