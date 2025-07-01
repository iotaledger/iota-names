// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useQueries } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/contexts';

import { createAuctionMetadataQuery } from '../lib/metadata';
import { AuctionMetadata } from '../lib/types';
import { useAuctionHouse } from './useAuctionHouse';
import { useGetAddressAuctionHistory } from './useGetAddressAuctionHistory';

export interface AuctionDetails {
    domain: string;
    metadata: AuctionMetadata | null;
    isLoading: boolean;
    error: boolean;
}

export function useGetUserAuctions() {
    const { iotaNamesClient } = useIotaNamesClient();
    const { data: auctionHouseData } = useAuctionHouse();
    const {
        data: userAuctionDomains = [],
        isLoading: isLoadingDomains,
        error: domainsError,
    } = useGetAddressAuctionHistory();

    const { auctionsTableObjectId } = auctionHouseData || {};
    const { packageId } = iotaNamesClient.config;

    const combinedResult = useQueries({
        queries: userAuctionDomains.map((domainName) =>
            createAuctionMetadataQuery({
                domainName,
                auctionsTableObjectId,
                packageId,
                graphQLClient: iotaNamesClient.graphQlClient,
            }),
        ),
        combine: (results) => {
            const auctionDetails: AuctionDetails[] = userAuctionDomains.map((domain, index) => {
                const result = results[index];
                return {
                    domain,
                    metadata: result.data || null,
                    isLoading: result.isLoading,
                    error: !!result.error,
                };
            });

            return {
                data: auctionDetails,
                isLoading: isLoadingDomains || results.some((result) => result.isLoading),
                error: !!domainsError || results.some((result) => result.error),
                userAuctionDomains,
            };
        },
    });

    return combinedResult;
}
