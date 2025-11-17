// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { formatAddress } from '@iota/iota-sdk/utils';

import { expect, test } from '../helpers/fixtures';
import {
    connectWallet,
    createWallet,
    getAddressByIndexPath,
    purchaseName,
    requestFaucetTokens,
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
    test('Connect address', async ({ appPage: page, context, sharedState }) => {
        const keypair = Ed25519Keypair.deriveKeypair(sharedState.wallet.mnemonic ?? '');
        const name = `e2etest-${Math.floor(Math.random() * 100)}.iota`;

        const { response } = await purchaseName(name, sharedState.wallet.address ?? '', keypair);
        expect(response.effects?.status.status).toBe('success');

        await page.goto('/my-names');
        const nameCards = page.getByTestId('name-card');
        await expect(nameCards.first()).toBeVisible({ timeout: 10_000 });

        const nameCard = page.getByTestId('name-card').first();
        await nameCard.getByTestId('name-card-avatar').hover();
        const menuButtonLocator = nameCard.getByTestId('menu-button');
        await expect(menuButtonLocator).toBeVisible();
        await menuButtonLocator.click();

        await page.getByText('Connect to Address', { exact: true }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByText('Connect to Address')).toBeVisible();

        const mnemonic = sharedState.wallet.mnemonic as string;
        const externalAddress = getAddressByIndexPath(mnemonic, 1);

        await dialog.getByPlaceholder('Enter Address').fill(externalAddress);
        await dialog.getByRole('button', { name: 'Apply' }).click();
        (await context.waitForEvent('page')).getByRole('button', { name: 'Approve' }).click();
        await page.bringToFront();

        await expect(page.getByText('Successfully connected', { exact: false })).toBeVisible({
            timeout: 30_000,
        });

        await page.close();
    });
});
