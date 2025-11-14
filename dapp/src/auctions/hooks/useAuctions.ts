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
    hasUserParticipated?: boolean;
}

export interface UseAuctionsOptions {
    /**
     * Filter auctions by user address.
     * If provided, returns only auctions the user has bid on.
     * If not provided, returns all available auctions.
     */
    userAddress?: string;
    /**
     * Determines which auctions to fetch.
     * - allAuctions (default): fetches public auctions and, if a user is provided,
     *   also fetches user auctions to detect participation.
     * - userAuctions: fetches only the auctions where the user has participated.
     */
    type?: 'allAuctions' | 'userAuctions';
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
    type = 'allAuctions',
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

    const shouldFetchAllAuctions = type === 'allAuctions';
    const shouldFetchUserAuctions =
        !!userAddress && (type === 'userAuctions' || type === 'allAuctions');

    const {
        data: allAuctions = NAMES_PLACEHOLDER,
        isLoading: isLoadingAllAuctions,
        error: allAuctionsError,
    } = useQuery<AuctionsResponse>({
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: [...queryKey.auctionList(), search, status, sort, sortBy, page, pageSize, type],
        queryFn: async () => {
            if (!indexerClient || !shouldFetchAllAuctions) {
                return NAMES_PLACEHOLDER;
            }

            return indexerClient.getAuctionList(status, search, sort, sortBy, page, pageSize);
        },
        enabled: !!indexerClient && shouldFetchAllAuctions,
        placeholderData: keepPreviousData,
    });

    const {
        data: userAuctions = NAMES_PLACEHOLDER,
        isLoading: isLoadingUserAuctions,
        error: userAuctionsError,
    } = useQuery<AuctionsResponse>({
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: [
            ...queryKey.userAuctionHistory(userAddress),
            search,
            status,
            sort,
            sortBy,
            page,
            pageSize,
            type,
        ],
        queryFn: async () => {
            if (!indexerClient || !userAddress || !shouldFetchUserAuctions) {
                return NAMES_PLACEHOLDER;
            }

            return indexerClient.getAllUserAuctions(userAddress);
        },
        enabled: !!indexerClient && shouldFetchUserAuctions,
        placeholderData: keepPreviousData,
    });

    const selectedAuctions = type === 'userAuctions' ? userAuctions : allAuctions;
    const isLoadingSelectedAuctions =
        type === 'userAuctions' ? isLoadingUserAuctions : isLoadingAllAuctions;
    const selectedAuctionsError = type === 'userAuctions' ? userAuctionsError : allAuctionsError;
    const userParticipationReady =
        shouldFetchUserAuctions && !isLoadingUserAuctions && !userAuctionsError && !!userAddress;
    const userParticipationSet = new Set(userAuctions.names);

    const { auctionsTableObjectId } = auctionHouseData || {};
    const { packageId } = iotaNamesClient.config;

    // Then, fetch metadata for each auction
    const combinedResult = useQueries({
        queries: selectedAuctions.names.map((name) =>
            createAuctionMetadataQuery({
                name,
                auctionsTableObjectId,
                packageId,
                graphQLClient: iotaNamesClient.graphQlClient,
            }),
        ),
        combine: (results) => {
            const auctionDetails: AuctionDetails[] = selectedAuctions.names.map((name, index) => {
                const result = results[index];
                return {
                    name,
                    metadata: result.data || null,
                    isLoading: result.isLoading || result.isPending,
                    error: !!result.error,
                    hasUserParticipated: userParticipationReady
                        ? userParticipationSet.has(name)
                        : undefined,
                };
            });

            return {
                data: auctionDetails,
                isLoading:
                    isLoadingSelectedAuctions || auctionDetails.some((result) => result.isLoading),
                error: !!selectedAuctionsError || auctionDetails.some((result) => result.error),
                auctionNames: selectedAuctions,
                isUserFiltered: type === 'userAuctions',
                page: selectedAuctions.page,
                pageSize: selectedAuctions.pageSize,
                totalItems: selectedAuctions.totalItems,
            };
        },
    });

    return combinedResult;
}
