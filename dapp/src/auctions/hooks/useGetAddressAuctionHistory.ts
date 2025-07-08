// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount } from '@iota/dapp-kit';
import { useQuery } from '@tanstack/react-query';

import { useIotaNamesIndexerClientContext } from '@/contexts';
import { queryKey } from '@/hooks/queryKey';

export function useGetAddressAuctionHistory() {
    const account = useCurrentAccount();
    const indexerClient = useIotaNamesIndexerClientContext();

    return useQuery({
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: [...queryKey.userAuctionHistory(account?.address)],
        queryFn: async () => {
            if (!account?.address || !indexerClient) {
                return [];
            }

            return indexerClient.getUserAuctions(account.address);
        },
        enabled: !!account?.address && !!indexerClient,
    });
}
