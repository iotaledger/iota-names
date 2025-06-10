// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount, useIotaClient } from '@iota/dapp-kit';
import { IotaNamesTransaction } from '@iota/iota-names-sdk';
import { graphql } from '@iota/iota-sdk/graphql/schemas/2025.2';
import { Transaction } from '@iota/iota-sdk/transactions';
import { useQuery } from '@tanstack/react-query';

import { getGasSummary } from '@/lib/utils/getGasSummary';
import { useIotaNamesClient } from '@/providers/contexts';

import { useGetNFTId } from './useGetNFTId';
import { useIotaGraphQLClient } from './useIotaGraphQLClient';

export function useAddSubname(subname: string) {
    const client = useIotaClient();
    const { iotaNamesClient } = useIotaNamesClient();
    const { iotaGraphQLClient } = useIotaGraphQLClient();
    const address = useCurrentAccount()?.address;
    const { data: nftIdData } = useGetNFTId(subname);

    return useQuery({
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: ['add-subname-transaction', address, subname, nftIdData?.parentNftId],
        queryFn: async () => {
            const tx = new Transaction();
            const iotaNamesTx = new IotaNamesTransaction(iotaNamesClient, tx);

            const parentNftId = nftIdData?.parentNftId;
            if (!parentNftId) {
                throw new Error('Parent NFT ID not found');
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: graphqlData } = await iotaGraphQLClient.query<any>({
                query: graphql(`
                    query Objects($filter: ObjectFilter, $first: Int) {
                        objects(filter: $filter, first: $first) {
                            nodes {
                                asMoveObject {
                                    contents {
                                        json
                                    }
                                }
                            }
                        }
                    }
                `),
                variables: {
                    filter: {
                        owner: address,
                        objectIds: parentNftId,
                    },
                    first: null,
                },
            });
            const expirationTimeParent =
                graphqlData?.objects?.nodes?.[0]?.asMoveObject?.contents?.json
                    .expiration_timestamp_ms;
            console.log('Expiration time for parent NFT:', expirationTimeParent);
            const subdomainNft = iotaNamesTx.createSubName({
                parentNft: tx.object(parentNftId),
                name: subname,
                expirationTimestampMs: expirationTimeParent,
                allowChildCreation: false,
                allowTimeExtension: false,
            });
            iotaNamesTx.transaction.transferObjects([subdomainNft], address ?? '');

            iotaNamesTx.transaction.setSender(address ?? '');
            const transaction = await iotaNamesTx.transaction.build({
                client,
            });

            const txDryRun = await client.dryRunTransactionBlock({
                transactionBlock: transaction,
            });
            return {
                transaction,
                txDryRun,
            };
        },
        enabled: !!address && !!subname && !!nftIdData?.parentNftId,
        gcTime: 0,
        select: ({ transaction, txDryRun }) => {
            return {
                transaction,
                gasSummary: getGasSummary(txDryRun),
            };
        },
    });
}
