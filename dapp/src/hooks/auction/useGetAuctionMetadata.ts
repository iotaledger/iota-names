// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { getDomainType } from '@iota/iota-names-sdk';
import { graphql } from '@iota/iota-sdk/graphql/schemas/2025.2';
import { fromB64 } from '@iota/iota-sdk/utils';
import { useQuery } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/contexts';
import { AuctionFieldBcs, createDomainFromName, deriveAuctionDynamicFieldId } from '@/lib/auction';

import { useIotaGraphQLClient } from '../useIotaGraphQLClient';
import { useAuctionHouse } from './useAuctionHouse';

export function useGetAuctionMetadata(domainName: string) {
    const { iotaNamesClient } = useIotaNamesClient();
    const { iotaGraphQLClient } = useIotaGraphQLClient();
    const { data: auctionHouseData } = useAuctionHouse();

    const { auctionsTableObjectId } = auctionHouseData || {};
    const { packageId } = iotaNamesClient.config;

    return useQuery({
        queryKey: ['auctionHouse', iotaGraphQLClient, packageId, auctionsTableObjectId, domainName],
        async queryFn() {
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

            const auctionObjectResponse = await iotaGraphQLClient.query<{
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
        },
        select: (data) => {
            const auctionBcsB64 = data?.object?.asMoveObject?.contents?.bcs;

            if (!auctionBcsB64) {
                throw new Error('Auction object not found');
            }

            const objectBCS = AuctionFieldBcs.parse(fromB64(auctionBcsB64));

            return objectBCS;
        },
        enabled: !!iotaGraphQLClient && !!auctionsTableObjectId && !!domainName,
    });
}
