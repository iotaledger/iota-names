// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';

import { useIotaNamesClient, useIotaNamesIndexerClientContext } from '@/contexts';
import { queryKey } from '@/hooks';

import { AuctionMetadata } from '../lib/types';
import { createAuctionMetadataQuery } from '../lib/utils/metadata';
import { AuctionsResponse } from '../services/IotaNamesIndexerClient';
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
     * Status to filter the auctions by.
     */
    status: 'all' | 'active' | 'finished';
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

    /**
     * Current page number.
     */
    page?: number;

    /**
     * Number of items per page.
     */
    pageSize?: number;
}

const NAMES_PLACEHOLDER: AuctionsResponse = {
    names: [],
    page: 0,
    pageSize: 0,
    totalItems: 0,
};

export function useAuctions({
    userAddress,
    search,
    status,
    sort,
    sortBy,
    page,
    pageSize,
}: UseAuctionsOptions) {
    const { iotaNamesClient } = useIotaNamesClient();
    const indexerClient = useIotaNamesIndexerClientContext();
    const { data: auctionHouseData } = useAuctionHouse();

    // Determine the appropriate query key and fetch function based on filter
    const queryKeyBase = userAddress
        ? queryKey.userAuctionHistory(userAddress)
        : queryKey.auctionList();

    // First, get the list of auction names (either user-specific or all)
    const {
        data: auctionNames = NAMES_PLACEHOLDER,
        isLoading: isLoadingNames,
        error: namesError,
    } = useQuery<AuctionsResponse>({
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: [...queryKeyBase, search, status, sort, sortBy, page, pageSize],
        queryFn: async () => {
            if (!indexerClient) {
                return NAMES_PLACEHOLDER;
            }

            // Fetch user-specific auctions or all auctions based on filter
            return userAddress
                ? indexerClient.getAllUserAuctions(userAddress)
                : indexerClient.getAuctionList(status, search, sort, sortBy, page, pageSize);
        },
        enabled: !!indexerClient && (!userAddress || !!userAddress),
        placeholderData: keepPreviousData,
    });

    const { auctionsTableObjectId } = auctionHouseData || {};
    const packageId = iotaNamesClient.getPackage('packageId', 'v1');

    // Then, fetch metadata for each auction
    const combinedResult = useQueries({
        queries: auctionNames.names.map((name) =>
            createAuctionMetadataQuery({
                name,
                auctionsTableObjectId,
                packageId,
                graphQLClient: iotaNamesClient.graphQlClient,
            }),
        ),
        combine: (results) => {
            const auctionDetails: AuctionDetails[] = auctionNames.names.map((name, index) => {
                const result = results[index];
                return {
                    name,
                    metadata: result.data || null,
                    isLoading: result.isLoading || result.isPending,
                    error: !!result.error,
                };
            });

            return {
                data: auctionDetails,
                isLoading: isLoadingNames || auctionDetails.some((result) => result.isLoading),
                error: !!namesError || auctionDetails.some((result) => result.error),
                auctionNames,
                isUserFiltered: !!userAddress,
                page: auctionNames.page,
                pageSize: auctionNames.pageSize,
                totalItems: auctionNames.totalItems,
            };
        },
    });

    return combinedResult;
}
