// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { getDomainType } from '@iota/iota-names-sdk';
import { IotaGraphQLClient } from '@iota/iota-sdk/graphql';
import { graphql } from '@iota/iota-sdk/graphql/schemas/2025.2';
import { fromB64, NANOS_PER_IOTA } from '@iota/iota-sdk/utils';

import { AuctionFieldBcs } from '../types/bcs';
import { AuctionMetadata, RawAuctionMetadata } from '../types/metadata';
import { deriveAuctionDynamicFieldId } from './dynamicField';
import { createDomainFromName } from './name';

interface FetchAuctionMetadataParams {
    domainName: string;
    auctionsTableObjectId: string;
    packageId: string;
    graphQLClient: IotaGraphQLClient;
}

export async function fetchAuctionMetadata({
    domainName,
    auctionsTableObjectId,
    packageId,
    graphQLClient,
}: FetchAuctionMetadataParams) {
    if (!auctionsTableObjectId || !domainName) {
        return null;
    }

    const domain = createDomainFromName(domainName);
    const domainTypeTag = getDomainType(packageId);

    const targetAuctionObjectId = deriveAuctionDynamicFieldId(
        auctionsTableObjectId,
        domainTypeTag,
        domain,
    );

    const auctionObjectResponse = await graphQLClient.query<{
        object: {
            address: string;
            asMoveObject: {
                contents: {
                    bcs: string;
                };
            };
        };
    }>({
        query: graphql(`
            query getAuction($id: String!) {
                object(address: $id) {
                    address
                    asMoveObject {
                        contents {
                            bcs
                        }
                    }
                }
            }
        `),
        variables: {
            id: targetAuctionObjectId,
        },
    });

    return auctionObjectResponse.data;
}

/**
 * Converts raw BCS auction data to normalized TypeScript interface
 */
function normalizeAuctionData(rawData: RawAuctionMetadata): AuctionMetadata | null {
    if (!rawData?.value?.value) {
        return null;
    }

    const auction = rawData.value.value;

    const currentBidNanos = BigInt(auction.current_bid.balance.value || BigInt(0));
    const minBidNanos = currentBidNanos + NANOS_PER_IOTA;

    return {
        domainName: auction.nft.domain_name,
        startTimestamp: new Date(Number(auction.start_timestamp_ms)),
        endTimestamp: new Date(Number(auction.end_timestamp_ms)),
        winner: auction.winner,
        currentBidNanos,
        minBidNanos,
        nftId: auction.nft.id,
        nftExpiration: new Date(Number(auction.nft.expiration_timestamp_ms)),
    };
}

/**
 * Parses raw auction data into the bcs type.
 */
function parseAuctionDataBcs(
    data: Awaited<ReturnType<typeof fetchAuctionMetadata>>,
): ReturnType<typeof AuctionFieldBcs.parse> | null {
    const auctionBcsB64 = data?.object?.asMoveObject?.contents?.bcs;

    if (!auctionBcsB64) {
        return null;
    }

    try {
        return AuctionFieldBcs.parse(fromB64(auctionBcsB64));
    } catch (error) {
        return null;
    }
}

interface CreateAuctionMetadataQueryParams {
    domainName: string;
    auctionsTableObjectId: string | undefined;
    packageId: string;
    graphQLClient: IotaGraphQLClient;
}

/**
 * Creates a React Query configuration object for fetching auction metadata
 */
export function createAuctionMetadataQuery({
    domainName,
    auctionsTableObjectId,
    packageId,
    graphQLClient,
}: CreateAuctionMetadataQueryParams) {
    return {
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: ['auction-metadata', packageId, auctionsTableObjectId, domainName],
        queryFn: async () => {
            if (!auctionsTableObjectId) {
                return null;
            }

            return fetchAuctionMetadata({
                domainName,
                auctionsTableObjectId,
                packageId,
                graphQLClient,
            });
        },
        select: (
            data: Awaited<ReturnType<typeof fetchAuctionMetadata>>,
        ): AuctionMetadata | null => {
            const auctionMetadataBcs = parseAuctionDataBcs(data);
            return normalizeAuctionData(auctionMetadataBcs);
        },
        enabled: !!auctionsTableObjectId && !!domainName,
    };
}
