// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/contexts';
import { queryKey } from '@/hooks/queryKey';
import { buildCreateAuctionTransaction, buildPlaceBidTransaction } from '@/lib/auction';

import { useAuctionHouse } from './useAuctionHouse';

interface BidArgs {
    name: string;
    bidNanos: bigint;
    isNewAuction: boolean;
}

export function useAuctionBid() {
    const qc = useQueryClient();
    const account = useCurrentAccount();
    const { iotaNamesClient } = useIotaNamesClient();
    const address = account?.address ?? '';
    const { data: auctionHouse } = useAuctionHouse();

    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

    return useMutation({
        mutationFn: async ({ name, bidNanos, isNewAuction }: BidArgs) => {
            if (!auctionHouse) throw new Error('Auction house not loaded');

            const tx = isNewAuction
                ? buildCreateAuctionTransaction(
                      iotaNamesClient.config.auctionPackageId,
                      iotaNamesClient.config.iotaNamesObjectId,
                      auctionHouse.auctionHouseId,
                      address,
                      bidNanos,
                      name,
                  )
                : buildPlaceBidTransaction(
                      iotaNamesClient.config.auctionPackageId,
                      auctionHouse.auctionHouseId,
                      address,
                      bidNanos,
                      name,
                  );

            await signAndExecuteTransaction({
                transaction: tx,
            });
            return { name };
        },
        onSuccess: (_, { name }) => {
            // Invalidate relevant queries to refresh data
            qc.invalidateQueries({ queryKey: queryKey.nameRecord(name) });
            qc.invalidateQueries({ queryKey: ['auctionHouse'] });
            qc.invalidateQueries({ queryKey: ['user-auctions'] });
            qc.invalidateQueries({ queryKey: ['auction-metadata'] });
        },
    });
}
