// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useIotaClientContext } from '@iota/dapp-kit';
import { IotaNamesTransaction } from '@iota/iota-names-sdk';
import { getNetwork, IotaClient } from '@iota/iota-sdk/client';
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
    const { network } = useIotaClientContext();

    // TODO: We need to use this client (graphql transport)
    // const client = useIotaClient();
    const { iotaNamesClient } = useIotaNamesClient();

    return useQuery({
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: ['register-name-transaction', address, name, years, price],
        queryFn: async () => {
            try {
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

                // TODO Fix
                // This is a workaround to pass through the methods
                // and see where it fails next...
                const rpcIotaClient = new IotaClient({ url: getNetwork(network).url });

                let transaction;
                try {
                    transaction = await iotaNamesTx.transaction.build({
                        // TODO https://github.com/iotaledger/iota/issues/7285 - transaction.build NOT WORKING on a client with graphql transport
                        client: rpcIotaClient,
                    });
                } catch (buildError) {
                    console.error('Dry run failed:', buildError);
                    console.error('Dry run error stack:', (buildError as Error)?.stack);
                    throw new Error(
                        `Failed to build transaction: ${(buildError as Error)?.message || 'Unknown error'}`,
                    );
                }

                let txDryRun;
                try {
                    // TODO https://github.com/iotaledger/iota/issues/7286 - dryRunTransactionBlock throwing Unsupported method when used on a client with graphql transport
                    txDryRun = await rpcIotaClient.dryRunTransactionBlock({
                        transactionBlock: transaction,
                    });
                } catch (dryRunError) {
                    console.error('Dry run failed:', dryRunError);
                    console.error('Dry run error stack:', (dryRunError as Error)?.stack);

                    throw new Error(
                        `Failed to dry run transaction: ${(dryRunError as Error)?.message || String(dryRunError) || 'Unknown error'}`,
                    );
                }

                return {
                    transaction: tx,
                    txDryRun,
                };
            } catch (error) {
                console.error('Register name transaction failed:', error);
                throw error;
            }
        },
        enabled: !!address && !!price && !!name && name.length > 0,
        gcTime: 0,
        retry: 2,
        select: ({ transaction, txDryRun }) => {
            return {
                transaction,
                gasSummary: txDryRun ? getGasSummary(txDryRun) : null,
            };
        },
    });
}
