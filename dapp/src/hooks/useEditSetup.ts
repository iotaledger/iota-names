// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount, useIotaClient } from '@iota/dapp-kit';
import { IotaNamesTransaction } from '@iota/iota-names-sdk';
import { Transaction } from '@iota/iota-sdk/transactions';
import { useQueryClient } from '@tanstack/react-query';

import { getGasSummary } from '@/lib/utils/getGasSummary';
import { useIotaNamesClient } from '@/providers/contexts';

export function useEditSetup() {
    const client = useIotaClient();
    const { iotaNamesClient } = useIotaNamesClient();
    const account = useCurrentAccount();
    const address = account?.address ?? '';
    const queryClient = useQueryClient();

    return async (
        parentNft: string,
        name: string,
        allowChildCreation: boolean,
        allowTimeExtension: boolean,
    ) => {
        if (!address || !parentNft || !name) {
            throw new Error('Required parameters are missing');
        }

        try {
            const result = await queryClient.fetchQuery({
                queryKey: [
                    'edit-setup-transaction',
                    address,
                    client,
                    parentNft,
                    name,
                    allowChildCreation,
                    allowTimeExtension,
                ],
                queryFn: async () => {
                    const tx = new Transaction();
                    const iotaNamesTx = new IotaNamesTransaction(iotaNamesClient, tx);
                    parentNft =
                        '0xcca9951ec2779f0fc01a1aa012175c0749c5a307a037e1e1f8ad42458b696c0a'; // remove
                    name = 'tooling.superdomain00.iota'; // remove
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
                gcTime: 0,
            });

            return {
                transaction: result,
                gasSummary: getGasSummary(result.txDryRun),
            };
        } catch (error) {
            console.error('Error en la transacción:', error);
            throw error;
        }
    };
}
