// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount } from '@iota/dapp-kit';
import { graphql } from '@iota/iota-sdk/graphql/schemas/2025.2';
import { useInfiniteQuery } from '@tanstack/react-query';

import { useIotaGraphQLClient } from './useIotaGraphQLClient';

const MAX_NFTS_PER_REQUEST = 50;

interface RegistrationNft {
    name: string;
    description?: string;
    image_url?: string;
    link?: string;
    project_url?: string;
}

export interface PaginatedRegistrationNftsResponse {
    data: RegistrationNft[];
    hasNextPage: boolean;
    nextCursor?: string | null;
}

export function useRegistrationNfts() {
    const account = useCurrentAccount();
    const address = account?.address ?? '';

    const { iotaGraphQLClient } = useIotaGraphQLClient();

    function getDisplayValue(
        display: { key: string | null; value: string | null }[],
        key: string,
    ): string {
        return display.find((d) => d.key === key)?.value ?? '';
    }
    return useInfiniteQuery<PaginatedRegistrationNftsResponse>({
        queryKey: ['registration-nfts', address],
        initialPageParam: null,
        queryFn: async ({ pageParam }: { pageParam: unknown }) => {
            const response = await iotaGraphQLClient.query<{
                address: {
                    iotaNamesRegistrations: {
                        pageInfo: {
                            hasNextPage: boolean;
                            endCursor: string | null;
                        };
                        nodes: {
                            domain: string;
                            display: {
                                key: string | null;
                                value: string | null;
                                error: string | null;
                            }[];
                        }[];
                    };
                };
            }>({
                query: graphql(`
                    query resolveNameServiceNames(
                        $address: IotaAddress!
                        $limit: Int
                        $cursor: String
                    ) {
                        address(address: $address) {
                            iotaNamesRegistrations(first: $limit, after: $cursor) {
                                pageInfo {
                                    hasNextPage
                                    endCursor
                                }
                                nodes {
                                    domain
                                    display {
                                        key
                                        value
                                        error
                                    }
                                }
                            }
                        }
                    }
                `),
                variables: {
                    address,
                    limit: MAX_NFTS_PER_REQUEST,
                    cursor: pageParam,
                },
            });
            const pageInfo = response.data?.address?.iotaNamesRegistrations?.pageInfo;
            const nodes = response.data?.address?.iotaNamesRegistrations?.nodes;

            // Transform nodes into RegistrationNft objects
            const registrationNfts: RegistrationNft[] =
                nodes?.map((node) => ({
                    name: node.domain,
                    description: getDisplayValue(node.display, 'description'),
                    image_url: getDisplayValue(node.display, 'image_url'),
                    link: getDisplayValue(node.display, 'link'),
                    project_url: getDisplayValue(node.display, 'project_url'),
                })) ?? [];

            return {
                data: registrationNfts,
                hasNextPage: pageInfo?.hasNextPage ?? false,
                nextCursor: pageInfo?.endCursor ?? null,
            };
        },
        getNextPageParam: ({ hasNextPage, nextCursor }) => (hasNextPage ? nextCursor : null),
        enabled: !!address,
    });
}
