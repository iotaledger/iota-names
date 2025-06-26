// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useIotaClient } from '@iota/dapp-kit';
import { useQuery } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/contexts';
import { queryKey } from '@/hooks/queryKey';
import { buildClaimDomainTransaction } from '@/lib/auction/transaction';
import { getGasSummary } from '@/lib/utils/getGasSummary';

import { useAuctionHouse } from './useAuctionHouse';

export function useClaimAuctionTransaction(address: string, domain: string) {
    const client = useIotaClient();
    const { iotaNamesClient } = useIotaNamesClient();
    const { data: auctionHouseData } = useAuctionHouse();

    return useQuery({
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: [...queryKey.claimAuction(domain, address)],
        queryFn: async () => {
            if (!auctionHouseData?.auctionHouseId) {
                throw new Error('Auction house not available');
            }

            const transaction = buildClaimDomainTransaction(
                iotaNamesClient.config.auctionPackageId,
                auctionHouseData.auctionHouseId,
                address,
                domain,
            );

            const builtTransaction = await transaction.build({
                client,
            });

            const txDryRun = await client.dryRunTransactionBlock({
                transactionBlock: builtTransaction,
            });

            return {
                transaction,
                txDryRun,
            };
        },
        enabled: !!address && !!domain && !!auctionHouseData?.auctionHouseId,
        gcTime: 0,
        select: ({ transaction, txDryRun }) => {
            return {
                transaction,
                gasSummary: getGasSummary(txDryRun),
            };
        },
    });
}
