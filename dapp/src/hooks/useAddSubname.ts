// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useIotaClient } from '@iota/dapp-kit';
import { IotaNamesTransaction } from '@iota/iota-names-sdk';
import { Transaction } from '@iota/iota-sdk/transactions';
import { useQuery } from '@tanstack/react-query';

import { getGasSummary } from '@/lib/utils/getGasSummary';
import { useIotaNamesClient } from '@/providers/contexts';

export function useAddSubname(address: string, subname: string, parentNftId: string) {
    const client = useIotaClient();
    const { iotaNamesClient } = useIotaNamesClient();

    return useQuery({
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: ['add-subname-transaction', address, subname, parentNftId],
        queryFn: async () => {
            const tx = new Transaction();
            const iotaNamesTx = new IotaNamesTransaction(iotaNamesClient, tx);
            const parentObject = await client.getObject({
                id: parentNftId,
                options: {
                    showContent: true,
                },
            });
            const expirationTimestampMs =
                parentObject.data?.content?.fields?.expiration_timestamp_ms;
            const subdomainNft = iotaNamesTx.createSubName({
                parentNft: tx.object(parentNftId),
                name: subname,
                expirationTimestampMs: expirationTimestampMs,
                allowChildCreation: false,
                allowTimeExtension: false,
            });
            iotaNamesTx.transaction.transferObjects([subdomainNft], address);

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
        enabled: !!address && !!subname && !!parentNftId,
        gcTime: 0,
        select: ({ transaction, txDryRun }) => {
            return {
                transaction,
                gasSummary: getGasSummary(txDryRun),
            };
        },
    });
}
