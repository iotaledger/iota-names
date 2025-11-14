// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0
import { getNetwork } from '@iota/iota-sdk/client';
import { requestIotaFromFaucetV0 } from '@iota/iota-sdk/faucet';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import type { BrowserContext, Page } from '@playwright/test';

import 'dotenv/config';

import { CONFIG } from '@/config';

import { expect } from './helpers/fixtures';

export async function connectWallet(page: Page, context: BrowserContext, extensionName: string) {
    await page.getByRole('button', { name: /Connect/i }).click();

    const termsLabel = page.getByText(
        'I have read, understand, and agree to the Terms of Service',
        { exact: true },
    );
    const acceptButton = page.getByRole('button', { name: /^Accept$/i });

    await termsLabel.scrollIntoViewIfNeeded();
    await termsLabel.click();
    await expect(acceptButton).toBeEnabled({ timeout: 5_000 });
    await acceptButton.click();

    const pagePromise = context.waitForEvent('page', { timeout: 20_000 });
    const walletButton = page.getByText(new RegExp(extensionName, 'i'));

    await walletButton.click();
    const walletApprovePage = await pagePromise;
    if (walletApprovePage) {
        await walletApprovePage.waitForLoadState('domcontentloaded');
        await walletApprovePage.bringToFront();
        await walletApprovePage.getByRole('button', { name: /Continue/i }).click();
        await walletApprovePage.getByRole('button', { name: /Connect/i }).click();
        await page.bringToFront();
    }
}

export async function createWallet(page: Page) {
    await page.bringToFront();
    await page.getByRole('button', { name: /Add Profile/ }).click({ timeout: 30000 });
    await page.getByText('Create New', { exact: true }).click();
    await page.getByTestId('password.input').fill('iotae2etests');
    await page.getByTestId('password.confirmation').fill('iotae2etests');
    await page.getByText('I read and agree').click();

    await page.getByRole('button', { name: /Create Wallet/ }).click();
    await page.waitForURL(new RegExp(/accounts\/backup/));

    const BOX_TEST_ID = 'mnemonic-display-box';
    const mnemonicBox = page.getByTestId(BOX_TEST_ID);

    await expect(mnemonicBox).toBeVisible();

    await mnemonicBox.getByRole('button').first().click();
    const textarea = mnemonicBox.locator('textarea');
    const mnemonic = await textarea.inputValue();

    const address = deriveAddressFromMnemonic(mnemonic);

    await page.getByText('I saved my mnemonic').click();
    await page.getByRole('button', { name: 'Open Wallet' }).click();
    await page.getByLabel('Open settings menu').click();
    await page.getByText('Network').click();
    await page.getByText('Custom RPC').click();
    await page.getByPlaceholder('http://localhost:3000/').fill(CONFIG.baseUrl);
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByTestId('close-icon').click();

    return {
        mnemonic,
        address,
    };
}

export async function requestFaucetTokens(recipient: string) {
    const currentNetwork = CONFIG.network;
    const networkConfig = getNetwork(currentNetwork);

    const faucetUrl = networkConfig.faucet;
    if (!faucetUrl) {
        throw new Error(`Faucet URL not defined for network: ${currentNetwork}`);
    }

    const res = await requestIotaFromFaucetV0({
        host: faucetUrl,
        recipient,
    });

    if (res.error) {
        throw new Error(`Faucet error: ${res.error}`);
    }
}

export function deriveAddressFromMnemonic(mnemonic: string, path?: string) {
    const keypair = Ed25519Keypair.deriveKeypair(mnemonic, path);
    const address = keypair.getPublicKey().toIotaAddress();
    return address;
}

export function getAddressByIndexPath(mnemonic: string, index: number) {
    return deriveAddressFromMnemonic(mnemonic, `m/44'/4218'/0'/0'/${index}'`);
}
