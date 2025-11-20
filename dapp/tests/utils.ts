// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import 'dotenv/config';

import { IotaNamesTransaction } from '@iota/iota-names-sdk';
import { getNetwork } from '@iota/iota-sdk/client';
import type { Signer } from '@iota/iota-sdk/cryptography';
import { requestIotaFromFaucetV0 } from '@iota/iota-sdk/faucet';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { Transaction } from '@iota/iota-sdk/transactions';
import { NANOS_PER_IOTA } from '@iota/iota-sdk/utils';
import type { BrowserContext, Page } from '@playwright/test';

import { buildCreateAuctionTransaction, buildPlaceBidTransaction } from '@/auctions';
import { CONFIG } from '@/config';

import { expect } from './helpers/fixtures';
import { iotaClient, iotaNamesClient } from './setup/utils';

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
    const networkId = CONFIG.network;
    const networkConfig = getNetwork(networkId);
    await page.getByPlaceholder('http://localhost:3000/').fill(networkConfig.url);
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

    console.log(`Requesting faucet tokens from ${faucetUrl} to address: ${recipient}`);
    const res = await requestIotaFromFaucetV0({
        host: faucetUrl,
        recipient,
    });

    if (res.error) {
        throw new Error(`Faucet error: ${res.error}`);
    }
}

export async function purchaseName(name: string, address: string, signer: Signer) {
    const tx = new Transaction();
    const iotaNamesTx = new IotaNamesTransaction(iotaNamesClient, tx);
    const [coin] = iotaNamesTx.transaction.splitCoins(tx.gas, [50_000_000_000]);
    const nft = await iotaNamesTx.register({
        name,
        coin,
        address,
    });
    iotaNamesTx.transaction.transferObjects([nft, coin], address);
    iotaNamesTx.transaction.setSender(address);
    const txBytes = await iotaNamesTx.transaction.build({
        client: iotaClient,
    });

    const txDryRun = await iotaClient.dryRunTransactionBlock({
        transactionBlock: txBytes,
    });

    if (txDryRun.effects.status.status !== 'success') {
        throw new Error(txDryRun.effects.status.error || 'Transaction dry run failed');
    }
    console.log(`Purchased name: ${name} with address: ${address}`);
    const response = await iotaClient.signAndExecuteTransaction({
        transaction: txBytes,
        signer,
        options: {
            showEffects: true,
        },
    });
    return { nft, name, response };
}

export function deriveAddressFromMnemonic(mnemonic: string, path?: string) {
    const keypair = Ed25519Keypair.deriveKeypair(mnemonic, path);
    const address = keypair.getPublicKey().toIotaAddress();
    return address;
}

export function getAddressByIndexPath(mnemonic: string, index: number) {
    return deriveAddressFromMnemonic(mnemonic, `m/44'/4218'/0'/0'/${index}'`);
}

interface CreateAndSendAuctionTransaction {
    name: string;
    signer: Signer;
    bidAmountIota?: bigint;
}
export async function createAndSendAuctionTransaction({
    name,
    signer,
    bidAmountIota = BigInt(50),
}: CreateAndSendAuctionTransaction) {
    try {
        const tx = buildCreateAuctionTransaction(
            iotaNamesClient.config.auctionPackageId,
            iotaNamesClient.config.iotaNamesObjectId,
            iotaNamesClient.config.auctionHouseObjectId,
            signer.toIotaAddress(),
            bidAmountIota * NANOS_PER_IOTA,
            name,
        );

        const txBytes = await tx.build({ client: iotaClient });
        const txDryRun = await iotaClient.dryRunTransactionBlock({
            transactionBlock: txBytes,
        });

        if (txDryRun.effects.status.status !== 'success') {
            throw new Error(txDryRun.effects.status.error || 'Transaction dry run failed');
        }

        const response = await iotaClient.signAndExecuteTransaction({
            transaction: txBytes,
            signer,
            options: {
                showEffects: true,
            },
        });

        console.log('Transaction sent. Digest:', response.digest);
        console.log(`Successfully created auction for name: ${name}`);

        return response;
    } catch (error) {
        console.error('Error creating initial auction:', error);
        throw error;
    }
}

interface BidOnExistingAuction {
    name: string;
    signer: Signer;
    bidAmountIota?: bigint;
}
export async function bidOnExistingAuction({
    name,
    signer,
    bidAmountIota = BigInt(51),
}: BidOnExistingAuction) {
    try {
        const tx = buildPlaceBidTransaction(
            iotaNamesClient.config.auctionPackageId,
            iotaNamesClient.config.auctionHouseObjectId,
            signer.toIotaAddress(),
            bidAmountIota * NANOS_PER_IOTA,
            name,
        );

        const txBytes = await tx.build({ client: iotaClient });
        const txDryRun = await iotaClient.dryRunTransactionBlock({
            transactionBlock: txBytes,
        });

        if (txDryRun.effects.status.status !== 'success') {
            throw new Error(txDryRun.effects.status.error || 'Transaction dry run failed');
        }

        const response = await iotaClient.signAndExecuteTransaction({
            transaction: txBytes,
            signer,
            options: {
                showEffects: true,
            },
        });

        console.log('Transaction sent. Digest:', response.digest);
        console.log(`Successfully bid on existing auction for name: ${name}`);

        return response;
    } catch (error) {
        console.error('Error bidding on auction:', error);
        throw error;
    }
}

export function generateRandomName(name: string) {
    const random = Math.floor(Math.random() * 10_000);
    return `${name}${random}.iota`;
}
