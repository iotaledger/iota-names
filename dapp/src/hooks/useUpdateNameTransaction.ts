// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useIotaClient } from '@iota/dapp-kit';
import { IotaNamesTransaction } from '@iota/iota-names-sdk';
import { Transaction, TransactionObjectArgument } from '@iota/iota-sdk/transactions';
import { useQuery } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/providers/contexts';

interface UseUpdateNameTransactionOptions {
    address: string,
    name: string,
    nft: TransactionObjectArgument,

    updates: NameUpdate[]
}

type NameUpdate = {
    type: 'set-target-address',
    address: string,
    isSubname: boolean
} | {
    type: 'set-default',
    name: string
};


export function useUpdateNameTransaction({
    address,
    name,
    nft,
    updates
}: UseUpdateNameTransactionOptions) {
    const client = useIotaClient();
    const { iotaNamesClient } = useIotaNamesClient();

    return useQuery({
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: ['update-name-transaction', address, name, nft, updates],
        queryFn: async () => {
            const tx = new Transaction();
            const iotaNamesTx = new IotaNamesTransaction(iotaNamesClient, tx);

            for(const update of updates){
                switch(update.type){
                    case 'set-target-address':
                        iotaNamesTx.setTargetAddress({
                            nft,
                            address: update.address,
                            isSubname: update.isSubname,
                        })
                    break;
                    case 'set-default':
                        iotaNamesTx.setDefault(update.name)
                    break;
                }
            }

            iotaNamesTx.transaction.setSender(address);
            const transaction = await iotaNamesTx.transaction.build({
                client,
            });
            return transaction
        },
        enabled: !!address && !!updates.length && !!name && name.length > 0,
        gcTime: 0
    });
}
