// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@iota/iota-sdk/transactions';

import { adminKeypair, iotaClient, iotaNamesClient } from '../setup/utils';

export async function addToDenyList(
    labels: string[],
    labelType: 'blocked' | 'reserved',
): Promise<void> {
    const packageId = iotaNamesClient.getPackage('packageId');
    const iotaNamesObjectId = iotaNamesClient.getPackage('iotaNamesObjectId');
    const adminCap = iotaNamesClient.getPackage('adminCap');

    const target = `${packageId}::deny_list::add_${labelType}_labels`;

    const tx = new Transaction();

    tx.moveCall({
        target,
        arguments: [
            tx.object(iotaNamesObjectId),
            tx.object(adminCap),
            tx.pure.vector('string', labels),
        ],
    });

    tx.setSender(adminKeypair.toIotaAddress());

    const resp = await iotaClient.signAndExecuteTransaction({
        transaction: await tx.build({
            client: iotaClient,
        }),
        signer: adminKeypair,
        options: {
            showEffects: true,
        },
    });

    if (resp.effects?.status.status !== 'success') {
        throw new Error(`Failed to add ${labelType} labels`);
    }
}
