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
    purchaseName,
    requestFaucetTokens,
} from '../utils';

test.setTimeout(60_000);
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

        const response = await purchaseName(name, keypair);
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

    test('Create subname', async ({ appPage: page, context, sharedState }) => {
        const keypair = Ed25519Keypair.deriveKeypair(sharedState.wallet.mnemonic ?? '');
        const name = generateRandomName('display');
        const response = await purchaseName(name, keypair);
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

        await page.getByText('Create Subname', { exact: true }).click();

        const dialog = page.getByRole('dialog');
        await expect(dialog.getByText('New Subname')).toBeVisible();

        const subname = 'sub-' + Math.floor(Math.random() * 1000);
        await dialog.getByPlaceholder('Enter subname').fill(subname);

        await dialog.getByRole('button', { name: 'Create' }).click();
        (await context.waitForEvent('page')).getByRole('button', { name: 'Approve' }).click();
        await page.bringToFront();

        await expect(page.getByText('Successfully created subname', { exact: false })).toBeVisible({
            timeout: 30_000,
        });

        await page.close();
    });

    test('Set name avatar', async ({ appPage: page, context, sharedState }) => {
        const keypair = Ed25519Keypair.deriveKeypair(sharedState.wallet.mnemonic ?? '');

        const name = generateRandomName('display');
        const responsePurchase2 = await purchaseName(name, keypair);
        expect(responsePurchase2.effects?.status.status).toBe('success');

        await page.goto('/my-names');
        await expect(
            page.getByTestId('name-card').filter({ hasText: normalizeIotaName(name, 'at') }),
        ).toBeVisible({ timeout: 5_000 });
        const nameCard = page
            .getByTestId('name-card')
            .filter({ hasText: normalizeIotaName(name, 'at') });

        await nameCard.getByTestId('name-card-avatar').hover();
        const menuButtonLocator = nameCard.getByTestId('menu-button');
        await expect(menuButtonLocator).toBeVisible();
        await menuButtonLocator.click();
        await page.getByText('Personalize Avatar', { exact: true }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByText('Personalize Avatar', { exact: true })).toBeVisible();

        // Wait slightly over the React Query staleTime (10s) to ensure a refetch happens
        await page.waitForTimeout(10_001);

        // Simply pick the first available NFT card in the dialog
        const targetCard = dialog.locator('[data-testid="avatar-nft-card"]').first();
        await expect(targetCard).toBeVisible({ timeout: 10_000 });
        await targetCard.click({ force: true });

        await dialog.getByRole('button', { name: 'Save' }).click();
        (await context.waitForEvent('page')).getByRole('button', { name: 'Approve' }).click();
        await page.bringToFront();

        await expect(
            page.getByText('Successfully updated avatar for ' + normalizeIotaName(name, 'at'), {
                exact: false,
            }),
        ).toBeVisible({
            timeout: 10_000,
        });

        await page.close();
    });
});
