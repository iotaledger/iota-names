// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useIotaClient } from '@iota/dapp-kit';
import { IotaNamesTransaction } from '@iota/iota-names-sdk';
import { Transaction } from '@iota/iota-sdk/transactions';
import { useQuery } from '@tanstack/react-query';

import { getGasSummary } from '@/lib/utils/getGasSummary';
import { useIotaNamesClient } from '@/providers/contexts';

export function useRegisterNameTransaction(
    address: string,
    name: string,
    price: number,
    years: number = 1,
) {
    const client = useIotaClient();
    const { iotaNamesClient } = useIotaNamesClient();

    return useQuery({
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: ['register-name-transaction', address, name, years, price],
        queryFn: async () => {
            const tx = new Transaction();
            const iotaNamesTx = new IotaNamesTransaction(iotaNamesClient, tx);
            const [coin] = iotaNamesTx.transaction.splitCoins(tx.gas, [price]);
            const nft = iotaNamesTx.register({
                domain: name,
                years,
                coin,
            });
            iotaNamesTx.transaction.transferObjects([nft, coin], address);
            iotaNamesTx.transaction.setSender(address);
            const transaction = await iotaNamesTx.transaction.build({
                client,
            });
            const txDryRun = await client.dryRunTransactionBlock({
                transactionBlock: transaction,
            });
            return {
                transaction: tx,
                txDryRun,
            };
        },
        enabled: !!address && !!price && !!name && name.length > 0,
        gcTime: 0,
        select: ({ transaction, txDryRun }) => {
            return {
                transaction,
                gasSummary: getGasSummary(txDryRun),
            };
        },
    });
}
