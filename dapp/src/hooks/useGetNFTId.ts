// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount } from '@iota/dapp-kit';
import { getIotaNamesRegistrationType } from '@iota/iota-names-sdk';
import { useQuery } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/providers/contexts';

import { useGetAllOwnedObjects } from './useGetAllOwnedObjects';

export function useGetNFTId(name: string) {
    const account = useCurrentAccount();
    const address = account?.address ?? '';

    const { iotaNamesClient } = useIotaNamesClient();
    const packageId = iotaNamesClient.config.packageId;

    const { data: namesRegistrationData } = useGetAllOwnedObjects(address, {
        StructType: getIotaNamesRegistrationType(packageId),
    });
    return useQuery({
        queryKey: ['get-nft-id', address, name],
        queryFn: async () => {
            let parentNftId = '';
            namesRegistrationData?.forEach((item) => {
                if (item?.display?.data?.name === name) {
                    parentNftId = item?.objectId || '';
                }
            });
            return {
                parentNftId,
            };
        },
        enabled: !!address && !!name && !!namesRegistrationData,
        gcTime: 0,
        select: ({ parentNftId }) => {
            return {
                parentNftId,
            };
        },
    });
}
