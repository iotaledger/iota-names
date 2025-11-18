// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { formatAddress } from '@iota/iota-sdk/utils';

import { normalizeIotaName } from '../../../sdk/dist/esm/utils';
import { expect, test } from '../helpers/fixtures';
import {
    connectWallet,
    createWallet,
    generateRandomName,
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

    test('Renew an owned name', async ({ appPage: page, context, sharedState }) => {
        const keypair = Ed25519Keypair.deriveKeypair(sharedState.wallet.mnemonic ?? '');
        const name = generateRandomName('display');
        const { response } = await purchaseName(name, sharedState.wallet.address ?? '', keypair);
        expect(response.effects?.status.status).toBe('success');

        await page.goto('/my-names');
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

        await page.getByText('Renew Name', { exact: true }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByText('Renew Name', { exact: true })).toBeVisible();

        const yearSelect = dialog.getByRole('combobox');
        if (await yearSelect.isVisible().catch(() => false)) {
            await expect(yearSelect).toBeVisible();
        }

        await dialog.getByRole('button', { name: 'Renew' }).click();
        (await context.waitForEvent('page')).getByRole('button', { name: 'Approve' }).click();
        await page.bringToFront();

        await expect(page.getByText('Name renewed successfully', { exact: false })).toBeVisible({
            timeout: 30_000,
        });

        await page.close();
    });
});
