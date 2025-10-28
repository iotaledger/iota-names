// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { expect } from '@playwright/test';

import { getAuthorizedSmartContractTypes, iotaNamesClient, runCommand } from './utils';

function getUpdateAuthCommand(mode: 'enable' | 'disable', type: 'payment' | 'auction') {
    const authorize = mode === 'enable';

    return [
        'IOTA_NAMES_PACKAGE_ADDRESS=' + iotaNamesClient.config.packageId,
        'IOTA_NAMES_OBJECT_ID=' + iotaNamesClient.config.iotaNamesObjectId,
        'ADMIN_CAP=' + iotaNamesClient.config.adminCap,
        'IOTA_NAMES_PAYMENTS_PACKAGE_ADDRESS=' + iotaNamesClient.config.paymentsPackageId,
        'ADMIN_ADDRESS=' + iotaNamesClient.config.adminAddress,
        'IOTA_NAMES_AUCTIONS_PACKAGE_ADDRESS=' + iotaNamesClient.config.auctionPackageId,
        `iota client ptb --move-call $IOTA_NAMES_PACKAGE_ADDRESS::iota_names::${authorize ? 'authorize' : 'deauthorize'}'`,
        type === 'payment'
            ? '<$IOTA_NAMES_PAYMENTS_PACKAGE_ADDRESS::payments::PaymentsAuth>'
            : '<$IOTA_NAMES_AUCTIONS_PACKAGE_ADDRESS::auction::AuctionAuth>',
        '@$ADMIN_CAP @$IOTA_NAMES_OBJECT_ID --sender @$ADMIN_ADDRESS',
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
    const tasksToRun: Promise<void>[] = [];

    if (currentState.isAuctionAuthorized !== targetState.isAuctionAuthorized) {
        const action = targetState.isAuctionAuthorized ? 'enable' : 'disable';
        const command = allCommands.auction[action];
        tasksToRun.push(execTryCatch(command));
    }

    if (currentState.isPaymentAuthorized !== targetState.isPaymentAuthorized) {
        const action = targetState.isPaymentAuthorized ? 'enable' : 'disable';
        const command = allCommands.payment[action];
        tasksToRun.push(execTryCatch(command));
    }

    if (tasksToRun.length > 0) {
        await Promise.all(tasksToRun);
    }

    const finalState = await getAuthorizedSmartContractTypes();

    expect(finalState.isAuctionAuthorized).toBe(targetState.isAuctionAuthorized);
    expect(finalState.isPaymentAuthorized).toBe(targetState.isPaymentAuthorized);
}

async function execTryCatch(command: string) {
    try {
        const output = await runCommand(command);
        console.log('Command output:', output);
    } catch (error) {
        if (error instanceof Error) {
            console.error(error.message);
        }
        expect(error).toBeFalsy();
    }
}
