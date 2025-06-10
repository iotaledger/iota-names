// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useIotaClient } from '@iota/dapp-kit';
import { useQuery } from '@tanstack/react-query';

export function useGetOwnedObject(address: string, objectId: string | null | undefined) {
    const client = useIotaClient();
    return useQuery({
        queryKey: ['get-owned-object', address, objectId],
        queryFn: async () => {
            if (!address || !objectId) {
                return;
            }

            const { data: objectResponse } = await client.getObject({
                id: objectId,
                options: {
                    showType: true,
                    showContent: true,
                    showDisplay: true,
                },
            });

            return objectResponse;
        },
        staleTime: 10 * 1000,
        enabled: !!address && !!objectId,
    });
}
