// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@iota/iota-sdk/transactions';
import { expect } from '@playwright/test';

import {
    adminKeypair,
    getAuthorizedSmartContractTypes,
    iotaClientGraphQl,
    iotaNamesClient,
    sleep,
} from './utils';

const envs = {
    IOTA_NAMES_PACKAGE_ADDRESS: iotaNamesClient.getPackage('packageId'),
    IOTA_NAMES_OBJECT_ID: iotaNamesClient.getPackage('iotaNamesObjectId'),
    ADMIN_CAP: iotaNamesClient.getPackage('adminCap'),
    IOTA_NAMES_PAYMENTS_PACKAGE_ADDRESS: iotaNamesClient.getPackage('paymentsPackageId'),
    ADMIN_ADDRESS: iotaNamesClient.getPackage('adminAddress'),
    IOTA_NAMES_AUCTIONS_PACKAGE_ADDRESS: iotaNamesClient.getPackage('auctionPackageId'),
};

async function sendAuthTransaction(authorize: boolean, mode: 'payment' | 'auction'): Promise<void> {
    const target = `${envs.IOTA_NAMES_PACKAGE_ADDRESS}::iota_names::${authorize ? 'authorize' : 'deauthorize'}`;

    const typeArg =
        mode === 'payment'
            ? `${envs.IOTA_NAMES_PAYMENTS_PACKAGE_ADDRESS}::payments::PaymentsAuth`
            : `${envs.IOTA_NAMES_AUCTIONS_PACKAGE_ADDRESS}::auction::AuctionAuth`;

    const tx = new Transaction();

    tx.moveCall({
        target,
        arguments: [tx.object(envs.ADMIN_CAP), tx.object(envs.IOTA_NAMES_OBJECT_ID)],
        typeArguments: [typeArg],
    });

    tx.setSender(adminKeypair.toIotaAddress());

    const resp = await iotaClientGraphQl.signAndExecuteTransaction({
        transaction: await tx.build({
            client: iotaClientGraphQl,
        }),
        signer: adminKeypair,
        options: {
            showEffects: true,
        },
    });

    if (resp.effects?.status.status === 'failure') {
        throw new Error(
            `Failed to ${authorize ? 'authorize' : 'deauthorize'} ${mode} smart contract: ${JSON.stringify(
                resp.effects.status,
            )}`,
        );
    }
}

export async function toggleSmartContractMode(mode: 'auctions' | 'purchases'): Promise<void> {
    if (!process.env.ADMIN_MNEMONIC) {
        throw new Error('env ADMIN_MNEMONIC not set. Cannot toggle smart contract mode.');
    }

    const targetState = {
        isAuctionAuthorized: mode === 'auctions',
        isPaymentAuthorized: mode === 'purchases',
    };

    const currentState = await getAuthorizedSmartContractTypes();

    if (currentState.isAuctionAuthorized !== targetState.isAuctionAuthorized) {
        await sleep(1000);
        await sendAuthTransaction(targetState.isAuctionAuthorized, 'auction');
    }

    if (currentState.isPaymentAuthorized !== targetState.isPaymentAuthorized) {
        await sleep(1000);
        await sendAuthTransaction(targetState.isPaymentAuthorized, 'payment');
    }

    if (
        currentState.isAuctionAuthorized === targetState.isAuctionAuthorized &&
        currentState.isPaymentAuthorized === targetState.isPaymentAuthorized
    ) {
        console.log('Smart contract modes are already in the target state. No changes made.');
        return;
    }

    // Wait for the transaction to settle
    await sleep(2000);

    const finalState = await getAuthorizedSmartContractTypes();

    expect(finalState.isAuctionAuthorized).toBe(targetState.isAuctionAuthorized);
    expect(finalState.isPaymentAuthorized).toBe(targetState.isPaymentAuthorized);
}
