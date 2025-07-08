// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useQueries } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/contexts';

import { AuctionMetadata } from '../lib/types';
import { createAuctionMetadataQuery } from '../lib/utils/metadata';
import { useAuctionHouse } from './useAuctionHouse';
import { useGetAddressAuctionHistory } from './useGetAddressAuctionHistory';

export interface AuctionDetails {
    name: string;
    metadata: AuctionMetadata | null;
    isLoading: boolean;
    error: boolean;
}

export function useGetUserAuctions() {
    const { iotaNamesClient } = useIotaNamesClient();
    const { data: auctionHouseData } = useAuctionHouse();
    const {
        data: userAuctionNames = [],
        isLoading: isLoadingNames,
        error: namesError,
    } = useGetAddressAuctionHistory();

    const { auctionsTableObjectId } = auctionHouseData || {};
    const { packageId } = iotaNamesClient.config;

    const combinedResult = useQueries({
        queries: userAuctionNames.map((name) =>
            createAuctionMetadataQuery({
                name,
                auctionsTableObjectId,
                packageId,
                graphQLClient: iotaNamesClient.graphQlClient,
            }),
        ),
        combine: (results) => {
            const auctionDetails: AuctionDetails[] = userAuctionNames.map((name, index) => {
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
                userAuctionNames,
            };
        },
    });

    return combinedResult;
}
