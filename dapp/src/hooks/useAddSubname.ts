// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount, useIotaClient } from '@iota/dapp-kit';
import { IotaNamesTransaction } from '@iota/iota-names-sdk';
import { Transaction } from '@iota/iota-sdk/transactions';
import { useQueryClient } from '@tanstack/react-query';

import { getGasSummary } from '@/lib/utils/getGasSummary';
import { useIotaNamesClient } from '@/providers/contexts';

export function useAddSubname() {
    const client = useIotaClient();
    const { iotaNamesClient } = useIotaNamesClient();
    const account = useCurrentAccount();
    const address = account?.address ?? '';
    const queryClient = useQueryClient();

    return async (subname: string, parentNftId: string, expirationTimeParent: number) => {
        if (!address || !subname || !parentNftId) {
            throw new Error('Required parameters are missing');
        }

        try {
            const result = await queryClient.fetchQuery({
                // eslint-disable-next-line @tanstack/query/exhaustive-deps
                queryKey: [
                    'add-subname-transaction',
                    address,
                    subname,
                    parentNftId,
                    expirationTimeParent,
                ],
                queryFn: async () => {
                    const tx = new Transaction();
                    const iotaNamesTx = new IotaNamesTransaction(iotaNamesClient, tx);

                    const subnameNft = iotaNamesTx.createSubName({
                        parentNft: tx.object(parentNftId),
                        name: subname,
                        expirationTimestampMs: expirationTimeParent,
                        allowChildCreation: false,
                        allowTimeExtension: false,
                    });

                    iotaNamesTx.transaction.transferObjects([subnameNft], address);
                    iotaNamesTx.transaction.setSender(address);
                    const transaction = await iotaNamesTx.transaction.build({ client });
                    const txDryRun = await client.dryRunTransactionBlock({
                        transactionBlock: transaction,
                    });

                    return {
                        transaction: tx,
                        txDryRun,
                    };
                },
                gcTime: 0,
            });

            return {
                transaction: result.transaction,
                gasSummary: getGasSummary(result.txDryRun),
            };
        } catch (error) {
            console.error('Error useAddSubname:', error);
            throw error;
        }
    };
}
