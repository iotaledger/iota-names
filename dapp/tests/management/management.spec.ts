// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { normalizeIotaName } from '@iota/iota-names-sdk';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { formatAddress } from '@iota/iota-sdk/utils';

import { formatDate } from '@/lib/utils/format/formatDate';

import { expect, test } from '../helpers/fixtures';
import { iotaNamesClient } from '../setup/utils';
import {
    addSubnameName,
    connectWallet,
    createWallet,
    editSetup,
    generateRandomName,
    generateRandomSubname,
    getAddressByIndexPath,
    purchaseName,
    requestFaucetTokens,
} from '../utils';

test.setTimeout(60_000);
test.describe.parallel('Name Management Tests', () => {
    test.setTimeout(60_000);
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

    test('Add subname to a subname', async ({ appPage: page, context, sharedState }) => {
        const keypair = Ed25519Keypair.deriveKeypair(sharedState.wallet.mnemonic ?? '');
        const name = generateRandomName('addsubname');
        const subname = generateRandomSubname('subname', name);
        const responsePurchase = await purchaseName(name, keypair);
        expect(responsePurchase.effects?.status.status).toBe('success');

        const record = await iotaNamesClient.getNameRecord(name);
        if (!record) throw new Error('Name record not found');

        const responsePurchaseSubname = await addSubnameName(
            subname,
            record.nftId,
            record.expirationDate,
            keypair,
        );
        expect(responsePurchaseSubname.effects?.status.status).toBe('success');

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

        await page.getByText('Create Subname', { exact: true }).click();

        const dialog = page.getByRole('dialog');
        await expect(dialog.getByText('New Subname')).toBeVisible();

        await dialog.getByPlaceholder('Enter subname').fill('subname');

        await dialog.getByRole('button', { name: 'Create' }).click();
        (await context.waitForEvent('page')).getByRole('button', { name: 'Approve' }).click();
        await page.bringToFront();

        await expect(page.getByText('Successfully created subname', { exact: false })).toBeVisible({
            timeout: 30_000,
        });

        await page.close();
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
        const name = generateRandomName('subname');
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

        await dialog.getByPlaceholder('Enter subname').fill('subname');

        await dialog.getByRole('button', { name: 'Create' }).click();
        (await context.waitForEvent('page')).getByRole('button', { name: 'Approve' }).click();
        await page.bringToFront();

        await expect(page.getByText('Successfully created subname', { exact: false })).toBeVisible({
            timeout: 30_000,
        });

        await page.close();
    });

    test('Connect address', async ({ appPage: page, context, sharedState }) => {
        const keypair = Ed25519Keypair.deriveKeypair(sharedState.wallet.mnemonic ?? '');
        const name = generateRandomName('connect');

        const responsePurchase = await purchaseName(name, keypair);
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

    test('Set permissions to a subname', async ({ appPage: page, context, sharedState }) => {
        const keypair = Ed25519Keypair.deriveKeypair(sharedState.wallet.mnemonic ?? '');
        const name = generateRandomName('display');
        const subname = generateRandomSubname('subname', name);
        const responsePurchase = await purchaseName(name, keypair);
        expect(responsePurchase.effects?.status.status).toBe('success');

        const record = await iotaNamesClient.getNameRecord(name);
        if (!record) throw new Error('Name record not found');

        const responsePurchaseSubname = await addSubnameName(
            subname,
            record.nftId,
            record.expirationDate,
            keypair,
        );
        expect(responsePurchaseSubname.effects?.status.status).toBe('success');

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

        await page.getByText('Set Permissions', { exact: true }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByText('Set permissions')).toBeVisible();

        const allowSubnamesLabel = dialog.getByText('Allow Subname to create additional Subnames');
        await expect(allowSubnamesLabel).toBeVisible();
        await allowSubnamesLabel.click();

        const allowRenewLabel = dialog.getByText('Allow Subname to renew expiration');
        await expect(allowRenewLabel).toBeVisible();
        await allowRenewLabel.click();

        const saveBtn = dialog.getByRole('button', { name: 'Save' });
        await expect(saveBtn).toBeEnabled();

        await dialog.getByRole('button', { name: 'Save' }).click();
        (await context.waitForEvent('page')).getByRole('button', { name: 'Approve' }).click();
        await page.bringToFront();

        await expect(
            page.getByText('Permissions updated successfully', { exact: false }),
        ).toBeVisible({ timeout: 30_000 });

        await page.close();
    });

    test('Can not add subname to a subname due permissions', async ({
        appPage: page,
        sharedState,
    }) => {
        const keypair = Ed25519Keypair.deriveKeypair(sharedState.wallet.mnemonic ?? '');
        const name = generateRandomName('display');
        const subname = generateRandomSubname('subname', name);
        const responsePurchase = await purchaseName(name, keypair);
        expect(responsePurchase.effects?.status.status).toBe('success');

        const record = await iotaNamesClient.getNameRecord(name);
        if (!record) throw new Error('Name record not found');

        const responsePurchaseSubname = await addSubnameName(
            subname,
            record.nftId,
            record.expirationDate,
            keypair,
        );
        expect(responsePurchaseSubname.effects?.status.status).toBe('success');

        const responseEditSetup = await editSetup(subname, record.nftId, false, false, keypair);
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

        // Method 2: Adding via subname counter
        await page.reload();

        const reloadedNameCard = page
            .getByTestId('name-card')
            .filter({ hasText: normalizeIotaName(subname, 'at') });
        await expect(reloadedNameCard).toBeVisible({ timeout: 10_000 });

        const subnamesCountLocator = reloadedNameCard.getByText('0 Subnames', { exact: true });
        await expect(subnamesCountLocator).toBeVisible({ timeout: 5_000 });
        await subnamesCountLocator.click();

        const newSubnameButton = page.getByRole('button', { name: 'New Subname' });
        await expect(newSubnameButton).toBeDisabled();

        // Method 3: Adding via parent subname counter
        await page.reload();

        const parentNameCard = page
            .getByTestId('name-card')
            .filter({ hasText: normalizeIotaName(name, 'at') })
            .filter({ has: page.getByText('1 Subname', { exact: true }) });

        await expect(parentNameCard).toBeVisible({ timeout: 5_000 });

        const parentCountLocator = parentNameCard.getByText('1 Subname', { exact: true });
        await expect(parentCountLocator).toBeVisible({ timeout: 5_000 });
        await parentCountLocator.click();

        const subnamesDialog = page.getByRole('dialog');
        await expect(subnamesDialog).toBeVisible();

        const subnameMenuButton = subnamesDialog.getByTestId('menu-button');
        await expect(subnameMenuButton).toBeVisible({ timeout: 5_000 });
        await subnameMenuButton.click();

        await expect(page.getByText('Create Subname', { exact: true })).toHaveCount(0);

        await page.close();
    });
});
