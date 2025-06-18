// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useIotaClient } from '@iota/dapp-kit';
import { IotaNamesTransaction } from '@iota/iota-names-sdk';
import { Transaction } from '@iota/iota-sdk/transactions';
import { useQuery } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/contexts';

import { queryKey } from './queryKey';

interface UseDeleteNameTransactionOptions {
    nft: string;
    isSubname: boolean;
    address: string;
}

export function useDeleteNameTransaction({
    nft,
    isSubname,
    address,
}: UseDeleteNameTransactionOptions) {
    const client = useIotaClient();
    const { iotaNamesClient } = useIotaNamesClient();

    return useQuery({
        queryKey: [...queryKey.deleteName(nft, address), isSubname, client],
        queryFn: async () => {
            const tx = new Transaction();
            const iotaNamesTx = new IotaNamesTransaction(iotaNamesClient, tx);

            iotaNamesTx.burnExpired({
                nft: nft,
                isSubname,
            });
            iotaNamesTx.transaction.setSender(address);
            await iotaNamesTx.transaction.build({ client });
            return iotaNamesTx.transaction;
        },
        enabled: !!nft && nft.length > 0 && !!iotaNamesClient && !!client,
        gcTime: 0,
    });
}
