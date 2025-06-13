// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount, useIotaClient } from '@iota/dapp-kit';
import { IotaNamesTransaction } from '@iota/iota-names-sdk';
import { Transaction } from '@iota/iota-sdk/transactions';
import { useQuery } from '@tanstack/react-query';

import { getGasSummary } from '@/lib/utils/getGasSummary';
import { useIotaNamesClient } from '@/providers/contexts';

export function useEditSetup(
    parentNft: string,
    name: string,
    allowChildCreation: boolean,
    allowTimeExtension: boolean,
) {
    const client = useIotaClient();
    const { iotaNamesClient } = useIotaNamesClient();
    const account = useCurrentAccount();
    const address = account?.address ?? '';
    return useQuery({
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: [
            'edit-setup-transaction',
            parentNft,
            name,
            allowChildCreation,
            allowTimeExtension,
        ],
        queryFn: async () => {
            const tx = new Transaction();
            const iotaNamesTx = new IotaNamesTransaction(iotaNamesClient, tx);
            iotaNamesTx.editSetup({
                parentNft: tx.object(parentNft),
                name,
                allowChildCreation,
                allowTimeExtension,
            });
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
        enabled:
            !!address &&
            !!parentNft &&
            !!allowChildCreation &&
            !!allowTimeExtension &&
            !!name &&
            name.length > 0,
        gcTime: 0,
        select: ({ transaction, txDryRun }) => {
            return {
                transaction,
                gasSummary: getGasSummary(txDryRun),
            };
        },
    });
}
