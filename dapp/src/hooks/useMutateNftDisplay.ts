// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { ALLOWED_METADATA, IotaNamesTransaction } from '@iota/iota-names-sdk';
import { Transaction } from '@iota/iota-sdk/transactions';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { RegistrationNft } from '@/lib/interfaces/registration.interfaces';
import { useIotaNamesClient } from '@/providers/contexts';

interface UpdateNFTDisplayParams {
    newNftId: string;
}

export function useMutateNftDisplay(registrationNft: RegistrationNft) {
    const { iotaNamesClient } = useIotaNamesClient();
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ['update-nft-display', registrationNft.objectId],
        mutationFn: async ({ newNftId }: UpdateNFTDisplayParams) => {
            const tx = new Transaction();
            const iotaNamesTx = new IotaNamesTransaction(iotaNamesClient, tx);

            iotaNamesTx.setUserData({
                nft: registrationNft.objectId ?? '',
                key: ALLOWED_METADATA.avatar,
                value: newNftId,
            });

            return signAndExecuteTransaction({
                transaction: iotaNamesTx.transaction,
            });
        },
        onSettled: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['name-record', registrationNft.name],
            });
        },
    });
}
