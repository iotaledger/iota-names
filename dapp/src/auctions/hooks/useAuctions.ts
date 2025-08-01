// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useQueries, useQuery } from '@tanstack/react-query';

import { useIotaNamesClient, useIotaNamesIndexerClientContext } from '@/contexts';
import { queryKey } from '@/hooks';

import { AuctionMetadata } from '../lib/types';
import { createAuctionMetadataQuery } from '../lib/utils/metadata';
import { useAuctionHouse } from './useAuctionHouse';

export interface AuctionDetails {
    name: string;
    metadata: AuctionMetadata | null;
    isLoading: boolean;
    error: boolean;
}

export interface UseAuctionsOptions {
    /**
     * Filter auctions by user address.
     * If provided, returns only auctions the user has bid on.
     * If not provided, returns all available auctions.
     */
    userAddress?: string;
    /**
     * Search term to filter auction names.
     * Only applies when fetching all auctions (not user-specific).
     */
    search?: string;
    /**
     * Sort order for auctions.
     * Only applies when fetching all auctions (not user-specific).
     */
    sort?: 'asc' | 'desc';
    /**
     * Sort field for auctions.
     * Only applies when fetching all auctions (not user-specific).
     */
    sortBy?: 'bid' | 'name';
}

export function useAuctions(options: UseAuctionsOptions = {}) {
    const { userAddress, search, sort, sortBy } = options;
    const { iotaNamesClient } = useIotaNamesClient();
    const indexerClient = useIotaNamesIndexerClientContext();
    const { data: auctionHouseData } = useAuctionHouse();

    // Determine the appropriate query key and fetch function based on filter
    const queryKeyBase = userAddress
        ? queryKey.userAuctionHistory(userAddress)
        : queryKey.auctionList();

    // First, get the list of auction names (either user-specific or all)
    const {
        data: auctionNames = [],
        isLoading: isLoadingNames,
        error: namesError,
    } = useQuery({
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: [...queryKeyBase, search, sort, sortBy],
        queryFn: async () => {
            if (!indexerClient) {
                return [];
            }

            // Fetch user-specific auctions or all auctions based on filter
            return userAddress
                ? indexerClient.getUserAuctions(userAddress)
                : indexerClient.getAuctionList(search, sort, sortBy);
        },
        enabled: !!indexerClient && (!userAddress || !!userAddress),
    });

    const { auctionsTableObjectId } = auctionHouseData || {};
    const { packageId } = iotaNamesClient.config;

    // Then, fetch metadata for each auction
    const combinedResult = useQueries({
        queries: auctionNames.map((name) =>
            createAuctionMetadataQuery({
                name,
                auctionsTableObjectId,
                packageId,
                graphQLClient: iotaNamesClient.graphQlClient,
            }),
        ),
        combine: (results) => {
            const auctionDetails: AuctionDetails[] = auctionNames.map((name, index) => {
                const result = results[index];
                return {
                    name,
                    metadata: result.data || null,
                    isLoading: result.isLoading,
                    error: !!result.error,
                };
            });

            return {
                data: auctionDetails,
                isLoading: isLoadingNames || results.some((result) => result.isLoading),
                error: !!namesError || results.some((result) => result.error),
                auctionNames,
                isUserFiltered: !!userAddress,
            };
        },
    });

    return combinedResult;
}
