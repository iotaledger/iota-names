// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { expect } from '@playwright/test';

import { getAuthorizedSmartContractTypes, iotaNamesClient, runCommand } from './utils';

const envs = {
    IOTA_NAMES_PACKAGE_ADDRESS: iotaNamesClient.resolveRead('packageId'),
    IOTA_NAMES_OBJECT_ID: iotaNamesClient.resolveRead('iotaNamesObjectId'),
    ADMIN_CAP: iotaNamesClient.resolveRead('adminCap'),
    IOTA_NAMES_PAYMENTS_PACKAGE_ADDRESS: iotaNamesClient.resolveRead('paymentsPackageId'),
    ADMIN_ADDRESS: iotaNamesClient.resolveRead('adminAddress'),
    IOTA_NAMES_AUCTIONS_PACKAGE_ADDRESS: iotaNamesClient.resolveRead('auctionPackageId'),
};

function getUpdateAuthCommand(mode: 'enable' | 'disable', type: 'payment' | 'auction') {
    const authorize = mode === 'enable';

    return [
        `iota client ptb --move-call $IOTA_NAMES_PACKAGE_ADDRESS::iota_names::${authorize ? 'authorize' : 'deauthorize'} ` +
            (type === 'payment'
                ? '"<$IOTA_NAMES_PAYMENTS_PACKAGE_ADDRESS::payments::PaymentsAuth>"'
                : '"<$IOTA_NAMES_AUCTIONS_PACKAGE_ADDRESS::auction::AuctionAuth>"') +
            ' @$ADMIN_CAP @$IOTA_NAMES_OBJECT_ID --sender @$ADMIN_ADDRESS',
    ].join(' \\\n  ');
}

export async function toggleSmartContractMode(mode: 'auctions' | 'purchases'): Promise<void> {
    const targetState = {
        isAuctionAuthorized: mode === 'auctions',
        isPaymentAuthorized: mode === 'purchases',
    };

    const allCommands = {
        auction: {
            enable: getUpdateAuthCommand('enable', 'auction'),
            disable: getUpdateAuthCommand('disable', 'auction'),
        },
        payment: {
            enable: getUpdateAuthCommand('enable', 'payment'),
            disable: getUpdateAuthCommand('disable', 'payment'),
        },
    };

    const currentState = await getAuthorizedSmartContractTypes();

    if (currentState.isAuctionAuthorized !== targetState.isAuctionAuthorized) {
        const action = targetState.isAuctionAuthorized ? 'enable' : 'disable';
        const command = allCommands.auction[action];
        await execTryCatch(command, envs);

        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (currentState.isPaymentAuthorized !== targetState.isPaymentAuthorized) {
        const action = targetState.isPaymentAuthorized ? 'enable' : 'disable';
        const command = allCommands.payment[action];
        await execTryCatch(command, envs);
    }

    if (
        currentState.isAuctionAuthorized === targetState.isAuctionAuthorized &&
        currentState.isPaymentAuthorized === targetState.isPaymentAuthorized
    ) {
        console.log('Smart contract modes are already in the target state. No changes made.');
        return;
    }

    const finalState = await getAuthorizedSmartContractTypes();

    expect(finalState.isAuctionAuthorized).toBe(targetState.isAuctionAuthorized);
    expect(finalState.isPaymentAuthorized).toBe(targetState.isPaymentAuthorized);
}

async function execTryCatch(...args: Parameters<typeof runCommand>): Promise<void> {
    try {
        const output = await runCommand(...args);
        console.log('Command output:', output);
    } catch (error) {
        if (error instanceof Error) {
            console.error(error.message);
        }
        expect(error).toBeFalsy();
    }
}
