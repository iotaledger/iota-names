// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { graphql } from '@iota/iota-sdk/graphql/schemas/2025.2';
import { useQuery } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/contexts';

import { useIotaGraphQLClient } from '../useIotaGraphQLClient';

export function useAuctionHouse() {
    const { iotaNamesClient } = useIotaNamesClient();
    const { iotaGraphQLClient } = useIotaGraphQLClient();

    const auctionPackageId = iotaNamesClient.config.auctionPackageId;

    return useQuery({
        queryKey: ['auctionHouse', iotaGraphQLClient, auctionPackageId],
        async queryFn() {
            if (!iotaGraphQLClient) {
                return null;
            }

            const response = await iotaGraphQLClient.query<{
                objects: { edges: [{ node: { address: string } }] };
            }>({
                query: graphql(`
                    query getActionHouse($type: String!) {
                        objects(filter: { type: $type }) {
                            edges {
                                node {
                                    address
                                }
                            }
                        }
                    }
                `),
                variables: {
                    type: `${auctionPackageId}::auction::AuctionHouse`,
                },
            });

            return response.data;
        },
        select: (data) => {
            return data?.objects['edges'][0]?.node?.address || null;
        },
    });
}
