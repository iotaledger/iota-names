// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@iota/iota-sdk/transactions';

import { IotaNamesTransaction } from '../../../sdk/dist/esm/iota-names-transaction';
import { iotaNamesClient } from '../setup/utils';

export async function purchaseName() {
    const tx = new Transaction();
    const iotaNamesTx = new IotaNamesTransaction(iotaNamesClient, tx);
    const [coin] = iotaNamesTx.transaction.splitCoins(tx.gas, [10_000_000]);
    const name = `mycoolname${Math.floor(Math.random() * 1000)}.iota`;
    const nft = await iotaNamesTx.register({
        name,
        coin,
    });
    return { nft, name };
}
