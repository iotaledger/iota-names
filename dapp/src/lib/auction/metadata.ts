// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { getDomainType } from '@iota/iota-names-sdk';
import { IotaGraphQLClient } from '@iota/iota-sdk/graphql';
import { graphql } from '@iota/iota-sdk/graphql/schemas/2025.2';
import { fromB64 } from '@iota/iota-sdk/utils';

import { AuctionFieldBcs } from './bcs';
import { AuctionMetadata, normalizeAuctionData } from './types';
import { createDomainFromName, deriveAuctionDynamicFieldId } from './utils';

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
 * Parses raw auction data into the bcs type.
 */
export function parseAuctionDataBcs(
    data: Awaited<ReturnType<typeof fetchAuctionMetadata>>,
    options: { throwOnMissing?: boolean } = {},
): ReturnType<typeof AuctionFieldBcs.parse> | null {
    const auctionBcsB64 = data?.object?.asMoveObject?.contents?.bcs;

    if (!auctionBcsB64) {
        if (options.throwOnMissing) {
            throw new Error('Auction object not found');
        }
        return null;
    }

    try {
        const objectBCS = AuctionFieldBcs.parse(fromB64(auctionBcsB64));

        return objectBCS;
    } catch (error) {
        if (options.throwOnMissing) {
            throw error;
        }
        return null;
    }
}

interface CreateAuctionMetadataQueryParams {
    domainName: string;
    auctionsTableObjectId: string | undefined;
    packageId: string;
    graphQLClient: IotaGraphQLClient;
    throwOnMissing?: boolean;
}

/**
 * Creates a React Query configuration object for fetching auction metadata
 */
export function createAuctionMetadataQuery({
    domainName,
    auctionsTableObjectId,
    packageId,
    graphQLClient,
    throwOnMissing = false,
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
            const auctionMetadataBcs = parseAuctionDataBcs(data, { throwOnMissing });
            return normalizeAuctionData(auctionMetadataBcs);
        },
        enabled: !!auctionsTableObjectId && !!domainName,
    };
}
