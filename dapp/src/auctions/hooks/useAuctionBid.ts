// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount, useIotaClient } from '@iota/dapp-kit';
import { useQuery } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/contexts';
import { queryKey } from '@/hooks/queryKey';

import { buildCreateAuctionTransaction, buildPlaceBidTransaction } from '../lib/utils/transaction';
import { useAuctionHouse } from './useAuctionHouse';
import { useGetAuctionMetadata } from './useGetAuctionMetadata';

export interface UseActionBidParams {
    name: string;
    bidNanos: bigint;
}

export function useAuctionBid({ name, bidNanos }: UseActionBidParams) {
    const account = useCurrentAccount();
    const { iotaNamesClient } = useIotaNamesClient();
    const iotaClient = useIotaClient();
    const address = account?.address ?? '';
    const { data: auctionHouse } = useAuctionHouse();
    const { data: auctionMetadata, isLoading: isLoadingAuctionMetadata } =
        useGetAuctionMetadata(name);

    // Only once its finished loading we check if the bid amount is enough or not, but only if there is an existing auction
    const enableAuctionBid = !isLoadingAuctionMetadata
        ? auctionMetadata
            ? bidNanos >= auctionMetadata.minBidNanos
            : true
        : false;

    return useQuery({
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: [...queryKey.placeBid(address || ''), name, bidNanos.toString()],
        queryFn: async () => {
            if (!auctionHouse) throw new Error('Auction house not loaded');
            const transaction = !auctionMetadata
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
        enabled: enableAuctionBid,
    });
}
