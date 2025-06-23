// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useIotaClient, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { IotaNamesTransaction } from '@iota/iota-names-sdk';
import { Transaction } from '@iota/iota-sdk/transactions';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/contexts';

import { queryKey } from './queryKey';
import { RegistrationNft } from './useRegistrationNfts';

interface UseDeleteNameTransactionOptions {
    nft: RegistrationNft;
    address: string;
}

export function useDeleteNameTransaction({ nft, address }: UseDeleteNameTransactionOptions) {
    const { iotaNamesClient } = useIotaNamesClient();
    const iotaClient = useIotaClient();
    const queryClient = useQueryClient();
    const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

    return useMutation<void, Error, void>({
        mutationFn: async () => {
            const transaction = new Transaction();
            const iotaNamesTx = new IotaNamesTransaction(iotaNamesClient, transaction);

            iotaNamesTx.burnExpired({ nft: nft.objectId, isSubname: nft.isSubdomain });
            iotaNamesTx.transaction.setSender(address);
            await iotaNamesTx.transaction.build({ client: iotaClient });

            const signedTransaction = await signAndExecute({
                transaction: iotaNamesTx.transaction,
            });
            await iotaClient.waitForTransaction({ digest: signedTransaction.digest });
        },
        onError: (err) => console.error(err),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKey.ownedObjects(address) });
        },
    });
}
