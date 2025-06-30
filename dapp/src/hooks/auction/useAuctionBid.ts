// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount, useIotaClient } from '@iota/dapp-kit';
import { useQuery } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/contexts';
import { queryKey } from '@/hooks/queryKey';
import { buildCreateAuctionTransaction, buildPlaceBidTransaction } from '@/lib/auction';

import { useAuctionHouse } from './useAuctionHouse';

export interface UseActionBidParams {
    name: string;
    bidNanos: bigint;
    isNewAuction: boolean;
}

export function useAuctionBid({ name, bidNanos, isNewAuction }: UseActionBidParams) {
    const account = useCurrentAccount();
    const { iotaNamesClient } = useIotaNamesClient();
    const iotaClient = useIotaClient();
    const address = account?.address ?? '';
    const { data: auctionHouse } = useAuctionHouse();

    return useQuery({
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: [...queryKey.placeBid(address || ''), name, bidNanos, isNewAuction],
        queryFn: async () => {
            if (!auctionHouse) throw new Error('Auction house not loaded');

            const transaction = isNewAuction
                ? buildCreateAuctionTransaction(
                      iotaNamesClient.config.auctionPackageId,
                      iotaNamesClient.config.iotaNamesObjectId,
                      auctionHouse.auctionHouseId,
                      address,
                      bidNanos,
                      name,
                  )
                : buildPlaceBidTransaction(
                      iotaNamesClient.config.auctionPackageId,
                      auctionHouse.auctionHouseId,
                      address,
                      bidNanos,
                      name,
                  );

            await transaction.build({
                client: iotaClient,
            });

            return transaction;
        },
    });
}
