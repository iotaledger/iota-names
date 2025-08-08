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
                return {
                    names: [],
                    totalItems: 0,
                };
            }

            let names: string[] = [];
            let currentPage = 0;
            let totalItems: number | null = null;

            do {
                const response = await indexerClient.getUserAuctions(
                    account.address,
                    currentPage,
                    100,
                );
                names = names.concat(response.names);
                totalItems = response.totalItems ?? 0;
                currentPage = response.page + 1;
            } while (totalItems === null || totalItems > names.length);

            return {
                names,
                totalItems: totalItems || names.length,
            };
        },
        enabled: !!account?.address && !!indexerClient,
    });
}
