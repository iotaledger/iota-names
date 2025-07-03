// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Transaction } from '@iota/iota-sdk/transactions';
import { NANOS_PER_IOTA } from '@iota/iota-sdk/utils';
import { beforeAll, describe, expect, it } from 'vitest';

import { ALLOWED_METADATA, IotaNamesClient, IotaNamesTransaction } from '../src/index.js';
import { PackageInfo } from '../src/types';
import { getClient, getGraphQLClient, setupIotaClient, TestToolbox } from './toolbox';

const LOCALNET_PRICING = {
    THREE_LETTER: { registration: 0.5, renewal: 0.15 },
    FOUR_LETTER: { registration: 0.1, renewal: 0.05 },
    FIVE_PLUS_LETTER: { registration: 0.01, renewal: 0.005 },
} as const;

/**
 * Load localnet configuration from dynamically generated JSON file
 */
export function loadLocalnetConfig(): PackageInfo {
    try {
        // Resolve path to the generated localnet.json file
        const localnetConfigPath = resolve(__dirname, '../../scripts/package-info/localnet.json');

        // Read the generated configuration file
        const localnetConfig = JSON.parse(readFileSync(localnetConfigPath, 'utf8'));

        return {
            auctionPackageId: localnetConfig.auctionPackageId,
            coins: localnetConfig.coins,
            iotaNamesObjectId: localnetConfig.iotaNamesObjectId,
            packageId: localnetConfig.packageId,
            payments: {
                packageId: localnetConfig.paymentsPackageId,
            },
            registryTableId: localnetConfig.registryTableId,
            reverseRegistryTableId: localnetConfig.reverseRegistryTableId,
            subNamesPackageId: localnetConfig.subNamesPackageId,
            tempSubdomainsProxyPackageId: localnetConfig.tempSubdomainsProxyPackageId,
        };
    } catch (error) {
        throw new Error(
            `Failed to load localnet configuration: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

const localnetPackageInfo = loadLocalnetConfig();

export const e2eLocalnetDryRunFlow = async (toolbox: TestToolbox) => {
    // For localnet, we use the getClient helper from toolbox
    const graphQLClient = getGraphQLClient();
    const client = getClient();

    const sender = toolbox.address();
    const iotaNamesClient = new IotaNamesClient({
        graphQlClient: graphQLClient,
        packageInfo: localnetPackageInfo,
    });

    // Getting price lists for localnet
    const priceList = await iotaNamesClient.getPriceList();
    const renewalPriceList = await iotaNamesClient.getRenewalPriceList();

    // Expected lists for localnet - these match the configuration in scripts/init/packages.ts
    // From packages.ts lines 104-108: [0.5, 0.1, 0.01] * NANOS_PER_IOTA
    const expectedPriceList = new Map([
        [[3, 3], 0.5 * Number(NANOS_PER_IOTA)], // 500000000 nanos (0.5 IOTA)
        [[4, 4], 0.1 * Number(NANOS_PER_IOTA)], // 100000000 nanos (0.1 IOTA)
        [[5, 63], 0.01 * Number(NANOS_PER_IOTA)], // 10000000 nanos (0.01 IOTA)
    ]);

    // From packages.ts lines 126-130: [0.15, 0.05, 0.005] * NANOS_PER_IOTA
    const expectedRenewalPriceList = new Map([
        [[3, 3], 0.15 * Number(NANOS_PER_IOTA)], // 150000000 nanos (0.15 IOTA)
        [[4, 4], 0.05 * Number(NANOS_PER_IOTA)], // 50000000 nanos (0.05 IOTA)
        [[5, 63], 0.005 * Number(NANOS_PER_IOTA)], // 5000000 nanos (0.005 IOTA)
    ]);

    expect(priceList).toEqual(expectedPriceList);
    expect(renewalPriceList).toEqual(expectedRenewalPriceList);

    const tx = new Transaction();
    const iotaNamesTx = new IotaNamesTransaction(iotaNamesClient, tx);

    const uniqueName =
        (Date.now().toString(36) + Math.random().toString(36).substring(2)).repeat(2) + '.iota';

    // Split coins for registration payment
    const [coinInput] = iotaNamesTx.transaction.splitCoins(iotaNamesTx.transaction.gas, [
        10n * NANOS_PER_IOTA,
    ]);

    // Register a domain for 2 years
    const nft = iotaNamesTx.register({
        domain: uniqueName,
        years: 2,
        coinConfig: iotaNamesClient.config.coins.IOTA,
        coin: coinInput,
    });

    // Set the target address of the NFT
    iotaNamesTx.setTargetAddress({
        nft,
        address: sender,
        isSubname: false,
    });

    // Set this as the default name
    iotaNamesTx.setDefault(uniqueName);

    // Set metadata
    iotaNamesTx.setUserData({
        nft,
        key: ALLOWED_METADATA.avatar,
        value: '0x0',
    });

    iotaNamesTx.setUserData({
        nft,
        key: ALLOWED_METADATA.ipfs,
        value: '0x1',
    });

    // Create a subname
    const subNft = iotaNamesTx.createSubName({
        parentNft: nft,
        name: 'node.' + uniqueName,
        allowChildCreation: true,
        allowTimeExtension: true,
        expirationTimestampMs: Date.now() + 1000 * 60 * 60 * 24 * 30,
    });

    // Create leaf subnames and then remove them
    iotaNamesTx.createLeafSubName({
        parentNft: nft,
        name: 'leaf.' + uniqueName,
        targetAddress: sender,
    });
    iotaNamesTx.removeLeafSubName({ parentNft: nft, name: 'leaf.' + uniqueName });

    iotaNamesTx.createLeafSubName({
        parentNft: subNft,
        name: 'leaf.node.' + uniqueName,
        targetAddress: sender,
    });
    iotaNamesTx.removeLeafSubName({ parentNft: subNft, name: 'leaf.node.' + uniqueName });

    // Extend expiration for subNft
    iotaNamesTx.extendExpiration({
        nft: subNft,
        expirationTimestampMs: Date.now() + 1000 * 60 * 60 * 24 * 30 * 2,
    });

    // Edit setup for subname
    iotaNamesTx.editSetup({
        parentNft: nft,
        name: 'node.' + uniqueName,
        allowChildCreation: true,
        allowTimeExtension: false,
    });

    // Create another level of nesting
    const moreNestedNft = iotaNamesTx.createSubName({
        parentNft: subNft,
        name: 'more.node.' + uniqueName,
        allowChildCreation: true,
        allowTimeExtension: true,
        expirationTimestampMs: Date.now() + 1000 * 60 * 60 * 24 * 30,
    });

    iotaNamesTx.editSetup({
        parentNft: subNft,
        name: 'more.node.' + uniqueName,
        allowChildCreation: false,
        allowTimeExtension: false,
    });

    // Transfer all objects back to sender
    tx.transferObjects([moreNestedNft, subNft, nft, coinInput], tx.pure.address(sender));

    tx.setSender(sender);

    // For localnet, we don't need to hardcode gas payment
    // The gas payment will be provided automatically from the active wallet

    return client.dryRunTransactionBlock({
        transactionBlock: await tx.build({
            client: client,
        }),
    });
};

describe('IOTA Names Localnet Integration Tests', () => {
    let toolbox: TestToolbox;
    let client: IotaNamesClient;

    beforeAll(async () => {
        toolbox = await setupIotaClient();
        client = new IotaNamesClient({
            graphQlClient: getGraphQLClient(),
            packageInfo: localnetPackageInfo,
        });
    }, 120000);

    describe('Client settings', () => {
        it('client should have some balance', async () => {
            const balance = await toolbox.client.getBalance({
                owner: toolbox.address(),
            });

            console.log('Client:', balance);
            expect(Number(balance.totalBalance)).toBeGreaterThan(0);
        });
    });

    describe('Name Validation and Pricing', () => {
        it('should calculate correct prices for different name lengths', async () => {
            const threeLetter = await client.calculatePrice({
                name: 'abc.iota',
                years: 1,
            });
            const fourLetter = await client.calculatePrice({
                name: 'test.iota',
                years: 1,
            });
            const fiveLetter = await client.calculatePrice({
                name: 'hello.iota',
                years: 1,
            });

            expect(threeLetter).toBe(
                LOCALNET_PRICING.THREE_LETTER.registration * Number(NANOS_PER_IOTA),
            );
            expect(fourLetter).toBe(
                LOCALNET_PRICING.FOUR_LETTER.registration * Number(NANOS_PER_IOTA),
            );
            expect(fiveLetter).toBe(
                LOCALNET_PRICING.FIVE_PLUS_LETTER.registration * Number(NANOS_PER_IOTA),
            );
        }, 30000);

        it('should calculate multi-year pricing correctly', async () => {
            const testCases = [
                {
                    name: 'test.iota',
                    years: 1,
                    expectedPrice: calculateMultiYearPrice(LOCALNET_PRICING.FOUR_LETTER, 1),
                },
                {
                    name: 'test.iota',
                    years: 2,
                    expectedPrice: calculateMultiYearPrice(LOCALNET_PRICING.FOUR_LETTER, 2),
                },
                {
                    name: 'test.iota',
                    years: 3,
                    expectedPrice: calculateMultiYearPrice(LOCALNET_PRICING.FOUR_LETTER, 3),
                },
            ];

            for (const { name, years, expectedPrice } of testCases) {
                const price = await client.calculatePrice({ name, years });
                expect(price).toBe(expectedPrice);
            }
        }, 30000);

        it('should reject invalid names', async () => {
            await expect(client.calculatePrice({ name: 'invalid', years: 1 })).rejects.toThrow(
                'Invalid IOTA names',
            );

            await expect(client.calculatePrice({ name: 'test.iota', years: 0 })).rejects.toThrow();
        }, 30000);

        it('should reject subname pricing', async () => {
            await expect(
                client.calculatePrice({ name: 'sub.test.iota', years: 1 }),
            ).rejects.toThrow('Subdomains do not have a registration fee');
        }, 30000);
    });

    describe('Name Registration Flow', () => {
        it('should register a name with basic configuration', async () => {
            const tx = new Transaction();
            const iotaNamesTx = new IotaNamesTransaction(client, tx);

            const uniqueName = `test-${Date.now()}.iota`;

            const [coinInput] = iotaNamesTx.transaction.splitCoins(iotaNamesTx.transaction.gas, [
                10n * NANOS_PER_IOTA,
            ]);

            const nft = iotaNamesTx.register({
                domain: uniqueName,
                years: 1,
                coinConfig: client.config.coins.IOTA,
                coin: coinInput,
            });

            iotaNamesTx.setTargetAddress({
                nft,
                address: toolbox.address(),
                isSubname: false,
            });

            tx.transferObjects([nft, coinInput], tx.pure.address(toolbox.address()));
            tx.setSender(toolbox.address());

            const result = await toolbox.client.dryRunTransactionBlock({
                transactionBlock: await tx.build({
                    client: toolbox.client,
                }),
            });

            expect(result.effects.status.status).toBe('success');
        }, 60000);

        it('should register with metadata and set as default', async () => {
            const tx = new Transaction();
            const iotaNamesTx = new IotaNamesTransaction(client, tx);

            const uniqueName = `meta-${Date.now()}.iota`;

            const [coinInput] = iotaNamesTx.transaction.splitCoins(iotaNamesTx.transaction.gas, [
                10n * NANOS_PER_IOTA,
            ]);

            const nft = iotaNamesTx.register({
                domain: uniqueName,
                years: 2,
                coinConfig: client.config.coins.IOTA,
                coin: coinInput,
            });

            iotaNamesTx.setTargetAddress({
                nft,
                address: toolbox.address(),
                isSubname: false,
            });

            iotaNamesTx.setDefault(uniqueName);

            iotaNamesTx.setUserData({
                nft,
                key: ALLOWED_METADATA.avatar,
                value: '0x123456789abcdef',
            });

            iotaNamesTx.setUserData({
                nft,
                key: ALLOWED_METADATA.ipfs,
                value: '0xfedcba9876543210',
            });

            tx.transferObjects([nft, coinInput], tx.pure.address(toolbox.address()));
            tx.setSender(toolbox.address());

            const result = await toolbox.client.dryRunTransactionBlock({
                transactionBlock: await tx.build({
                    client: toolbox.client,
                }),
            });

            expect(result.effects.status.status).toBe('success');
        }, 60000);
    });

    describe('Subname Management', () => {
        it('should create and manage subnames', async () => {
            const tx = new Transaction();
            const iotaNamesTx = new IotaNamesTransaction(client, tx);

            const parentName = `parent-${Date.now()}.iota`;
            const subName = `sub.${parentName}`;

            const [coinInput] = iotaNamesTx.transaction.splitCoins(iotaNamesTx.transaction.gas, [
                10n * NANOS_PER_IOTA,
            ]);

            const parentNft = iotaNamesTx.register({
                domain: parentName,
                years: 1,
                coinConfig: client.config.coins.IOTA,
                coin: coinInput,
            });

            const subNft = iotaNamesTx.createSubName({
                parentNft,
                name: subName,
                allowChildCreation: true,
                allowTimeExtension: true,
                expirationTimestampMs: Date.now() + 1000 * 60 * 60 * 24 * 30,
            });

            iotaNamesTx.setTargetAddress({
                nft: subNft,
                address: toolbox.address(),
                isSubname: true,
            });

            tx.transferObjects([parentNft, subNft, coinInput], tx.pure.address(toolbox.address()));
            tx.setSender(toolbox.address());

            const result = await toolbox.client.dryRunTransactionBlock({
                transactionBlock: await tx.build({
                    client: toolbox.client,
                }),
            });

            expect(result.effects.status.status).toBe('success');
        }, 60000);

        it('should manage leaf subnames', async () => {
            const tx = new Transaction();
            const iotaNamesTx = new IotaNamesTransaction(client, tx);

            const parentName = `leafparent-${Date.now()}.iota`;
            const leafName = `leaf.${parentName}`;

            const [coinInput] = iotaNamesTx.transaction.splitCoins(iotaNamesTx.transaction.gas, [
                10n * NANOS_PER_IOTA,
            ]);

            const parentNft = iotaNamesTx.register({
                domain: parentName,
                years: 1,
                coinConfig: client.config.coins.IOTA,
                coin: coinInput,
            });

            iotaNamesTx.createLeafSubName({
                parentNft,
                name: leafName,
                targetAddress: toolbox.address(),
            });

            iotaNamesTx.removeLeafSubName({
                parentNft,
                name: leafName,
            });

            tx.transferObjects([parentNft, coinInput], tx.pure.address(toolbox.address()));
            tx.setSender(toolbox.address());

            const result = await toolbox.client.dryRunTransactionBlock({
                transactionBlock: await tx.build({
                    client: toolbox.client,
                }),
            });

            expect(result.effects.status.status).toBe('success');
        }, 60000);

        it('should extend subname expiration', async () => {
            const tx = new Transaction();
            const iotaNamesTx = new IotaNamesTransaction(client, tx);

            const parentName = `extend-${Date.now()}.iota`;
            const subName = `sub.${parentName}`;

            const [coinInput] = iotaNamesTx.transaction.splitCoins(iotaNamesTx.transaction.gas, [
                10n * NANOS_PER_IOTA,
            ]);

            const parentNft = iotaNamesTx.register({
                domain: parentName,
                years: 1,
                coinConfig: client.config.coins.IOTA,
                coin: coinInput,
            });

            const subNft = iotaNamesTx.createSubName({
                parentNft,
                name: subName,
                allowChildCreation: true,
                allowTimeExtension: true,
                expirationTimestampMs: Date.now() + 1000 * 60 * 60 * 24 * 30,
            });

            iotaNamesTx.extendExpiration({
                nft: subNft,
                expirationTimestampMs: Date.now() + 1000 * 60 * 60 * 24 * 60,
            });

            tx.transferObjects([parentNft, subNft, coinInput], tx.pure.address(toolbox.address()));
            tx.setSender(toolbox.address());

            const result = await toolbox.client.dryRunTransactionBlock({
                transactionBlock: await tx.build({
                    client: toolbox.client,
                }),
            });

            expect(result.effects.status.status).toBe('success');
        }, 60000);

        it('should edit subname permissions', async () => {
            const tx = new Transaction();
            const iotaNamesTx = new IotaNamesTransaction(client, tx);

            const parentName = `perms-${Date.now()}.iota`;
            const subName = `sub.${parentName}`;

            const [coinInput] = iotaNamesTx.transaction.splitCoins(iotaNamesTx.transaction.gas, [
                10n * NANOS_PER_IOTA,
            ]);

            const parentNft = iotaNamesTx.register({
                domain: parentName,
                years: 1,
                coinConfig: client.config.coins.IOTA,
                coin: coinInput,
            });

            const subNft = iotaNamesTx.createSubName({
                parentNft,
                name: subName,
                allowChildCreation: true,
                allowTimeExtension: true,
                expirationTimestampMs: Date.now() + 1000 * 60 * 60 * 24 * 30,
            });

            iotaNamesTx.editSetup({
                parentNft,
                name: subName,
                allowChildCreation: false,
                allowTimeExtension: false,
            });

            tx.transferObjects([parentNft, subNft, coinInput], tx.pure.address(toolbox.address()));
            tx.setSender(toolbox.address());

            const result = await toolbox.client.dryRunTransactionBlock({
                transactionBlock: await tx.build({
                    client: toolbox.client,
                }),
            });

            expect(result.effects.status.status).toBe('success');
        }, 60000);
    });

    describe('Complex Nested Scenarios', () => {
        it('should handle deeply nested subnames', async () => {
            const tx = new Transaction();
            const iotaNamesTx = new IotaNamesTransaction(client, tx);

            const rootName = `root-${Date.now()}.iota`;

            const [coinInput] = iotaNamesTx.transaction.splitCoins(iotaNamesTx.transaction.gas, [
                10n * NANOS_PER_IOTA,
            ]);

            // Register the root domain
            const rootNft = iotaNamesTx.register({
                domain: rootName,
                years: 1,
                coinConfig: client.config.coins.IOTA,
                coin: coinInput,
            });

            // Create first level subdomain: level1.root-{timestamp}.iota
            const level1Nft = iotaNamesTx.createSubName({
                parentNft: rootNft,
                name: `level1.${rootName}`,
                allowChildCreation: true,
                allowTimeExtension: true,
                expirationTimestampMs: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
            });

            // Create second level subdomain: level2.level1.root-{timestamp}.iota
            const level2Nft = iotaNamesTx.createSubName({
                parentNft: level1Nft,
                name: `level2.level1.${rootName}`,
                allowChildCreation: false,
                allowTimeExtension: false,
                expirationTimestampMs: Date.now() + 1000 * 60 * 60 * 24 * 15, // 15 days
            });

            // Transfer all objects back to the sender
            tx.transferObjects(
                [rootNft, level1Nft, level2Nft, coinInput],
                tx.pure.address(toolbox.address()),
            );
            tx.setSender(toolbox.address());

            const result = await toolbox.client.dryRunTransactionBlock({
                transactionBlock: await tx.build({
                    client: toolbox.client,
                }),
            });

            expect(result.effects.status.status).toBe('success');
        }, 60000);
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle empty or null metadata', async () => {
            const tx = new Transaction();
            const iotaNamesTx = new IotaNamesTransaction(client, tx);

            const uniqueName = `empty-meta-${Date.now()}.iota`;

            const [coinInput] = iotaNamesTx.transaction.splitCoins(iotaNamesTx.transaction.gas, [
                10n * NANOS_PER_IOTA,
            ]);

            const nft = iotaNamesTx.register({
                domain: uniqueName,
                years: 1,
                coinConfig: client.config.coins.IOTA,
                coin: coinInput,
            });

            iotaNamesTx.setUserData({
                nft,
                key: ALLOWED_METADATA.avatar,
                value: '',
            });

            tx.transferObjects([nft, coinInput], tx.pure.address(toolbox.address()));
            tx.setSender(toolbox.address());

            const result = await toolbox.client.dryRunTransactionBlock({
                transactionBlock: await tx.build({
                    client: toolbox.client,
                }),
            });

            expect(result.effects.status.status).toBe('success');
        }, 60000);

        it('should handle maximum year registration', async () => {
            const tx = new Transaction();
            const iotaNamesTx = new IotaNamesTransaction(client, tx);

            const uniqueName = `max-years-${Date.now()}.iota`;

            const [coinInput] = iotaNamesTx.transaction.splitCoins(iotaNamesTx.transaction.gas, [
                50n * NANOS_PER_IOTA,
            ]);

            const nft = iotaNamesTx.register({
                domain: uniqueName,
                years: 5,
                coinConfig: client.config.coins.IOTA,
                coin: coinInput,
            });

            tx.transferObjects([nft, coinInput], tx.pure.address(toolbox.address()));
            tx.setSender(toolbox.address());

            const result = await toolbox.client.dryRunTransactionBlock({
                transactionBlock: await tx.build({
                    client: toolbox.client,
                }),
            });

            expect(result.effects.status.status).toBe('success');
        }, 60000);
    });

    describe('Legacy E2E Flow', () => {
        it('should execute original e2e flow successfully', async () => {
            const res = await e2eLocalnetDryRunFlow(toolbox);
            expect(res.effects.status.status).toEqual('success');
        }, 60000);
    });
});

// Helper functions for better code organization
function toNanos(iotaAmount: number): number {
    return iotaAmount * Number(NANOS_PER_IOTA);
}

function calculateMultiYearPrice(
    pricing: { registration: number; renewal: number },
    years: number,
): number {
    const registrationCost = toNanos(pricing.registration);
    const renewalCost = toNanos(pricing.renewal) * (years - 1);
    return registrationCost + renewalCost;
}
