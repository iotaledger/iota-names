// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { getDomainType } from '@iota/iota-names-sdk';
import { graphql } from '@iota/iota-sdk/graphql/schemas/2025.2';
import { fromB64, NANOS_PER_IOTA } from '@iota/iota-sdk/utils';
import { useQuery } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/contexts';
import { AuctionFieldBcs, createDomainFromName, deriveAuctionDynamicFieldId } from '@/lib/auction';

import { queryKey } from '../queryKey';
import { useAuctionHouse } from './useAuctionHouse';

export function useGetAuctionMetadata(domainName: string) {
    const { iotaNamesClient } = useIotaNamesClient();
    const { data: auctionHouseData } = useAuctionHouse();

    const { auctionsTableObjectId } = auctionHouseData || {};
    const { packageId } = iotaNamesClient.config;

    return useQuery({
        queryKey: [...queryKey.auctionMetadata(domainName), packageId, auctionsTableObjectId],
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

            const auctionObjectResponse = await iotaNamesClient.graphQlClient.query<{
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
            const auctionBcsB64 = auctionObjectResponse.data?.object?.asMoveObject?.contents?.bcs;

            if (!auctionBcsB64) {
                return null;
            }

            const objectBCS = AuctionFieldBcs.parse(fromB64(auctionBcsB64));

            const minBidNanos =
                BigInt(objectBCS?.value.value.current_bid.balance.value || BigInt(0)) +
                NANOS_PER_IOTA;

            const endTimestamp = new Date(Number(objectBCS.value.value.end_timestamp_ms));

            const currentBid = BigInt(
                objectBCS?.value.value.current_bid.balance.value || BigInt(0),
            );

            return {
                raw: objectBCS,
                minBidNanos,
                endTimestamp,
                currentBid,
            };
        },
        enabled: !!auctionsTableObjectId && !!domainName,
    });
}
