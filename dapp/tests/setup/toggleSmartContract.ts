// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { expect } from '@playwright/test';

import {
    AUCTION_TYPE,
    getAuthorizedSmartContractTypes,
    iotaNamesClient,
    PAYMENT_TYPE,
    runCommand,
} from './utils';

function getUpdateAuthCommand(mode: 'enable' | 'disable', type: 'payment' | 'auction') {
    const authorize = mode === 'enable';
    const typeArg = type === 'payment' ? PAYMENT_TYPE : AUCTION_TYPE;

    return [
        'iota client call',
        `--package ${iotaNamesClient.config.packageId}`,
        '--module iota_names',
        `--function ${authorize ? 'authorize' : 'deauthorize'}`,
        `--args "${iotaNamesClient.config.adminCap}" "${iotaNamesClient.config.iotaNamesObjectId}"`,
        `--type-args "${typeArg}"`,
        `--sender ${iotaNamesClient.config.adminAddress}`,
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
