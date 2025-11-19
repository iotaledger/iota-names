// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { normalizeIotaName } from '@iota/iota-names-sdk';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { formatAddress } from '@iota/iota-sdk/utils';

import { formatDate } from '@/lib/utils/format/formatDate';

import { expect, test } from '../helpers/fixtures';
import { iotaNamesClient } from '../setup/utils';
import {
    connectWallet,
    createWallet,
    generateRandomName,
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
    test('View name info', async ({ appPage: page, sharedState }) => {
        const keypair = Ed25519Keypair.deriveKeypair(sharedState.wallet.mnemonic ?? '');
        const name = generateRandomName('display');

        const response = await purchaseName(name, sharedState.wallet.address ?? '', keypair);
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

        await page.getByText('View All Info', { exact: true }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByText('All Info')).toBeVisible();

        const record = await iotaNamesClient.getNameRecord(name);
        if (!record) throw new Error('Name record not found');
        const expectedOwner = formatAddress(sharedState.wallet.address ?? '');
        const expectedObjectId = formatAddress(record.nftId);
        const expectedExpirationText = formatDate(record.expirationDate);

        await expect(dialog.getByText('Owner', { exact: false })).toBeVisible();
        await expect(
            dialog.getByRole('link', {
                name: new RegExp(expectedOwner, 'i'),
            }),
        ).toBeVisible();
        await expect(dialog.getByText('Object ID', { exact: false })).toBeVisible();

        await expect(
            dialog.getByRole('link', {
                name: new RegExp(expectedObjectId, 'i'),
            }),
        ).toBeVisible();

        await expect(dialog.getByText('Expiration Time', { exact: false })).toBeVisible();
        await expect(dialog.getByText(expectedExpirationText)).toBeVisible();

        const closeIcon = page.getByTestId('close-icon');
        if (await closeIcon.isVisible().catch(() => false)) {
            await closeIcon.click();
        }

        await page.close();
    });
    test('Connect address', async ({ appPage: page, context, sharedState }) => {
        const keypair = Ed25519Keypair.deriveKeypair(sharedState.wallet.mnemonic ?? '');
        const name = generateRandomName('display');

        const responsePurchase = await purchaseName(
            name,
            sharedState.wallet.address ?? '',
            keypair,
        );
        expect(responsePurchase.effects?.status.status).toBe('success');

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
