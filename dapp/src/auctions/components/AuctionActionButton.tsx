// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Button, LoadingIndicator } from '@iota/apps-ui-kit';
import { useCurrentAccount, useIotaClient, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { Transaction } from '@iota/iota-sdk/transactions';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKey } from '@/hooks/queryKey';

import { useClaimAuctionTransaction } from '../hooks/useClaimAuctionTransaction';
import { AuctionDetails } from '../hooks/useGetUserAuctions';
import { getTimeRemaining, UserAuctionStatus } from '../lib/utils';

export function AuctionActionButton({
    auction,
    auctionStatus,
    onBidClick,
}: {
    auction: AuctionDetails;
    auctionStatus: UserAuctionStatus;
    onBidClick?: (targetName: string) => void;
}) {
    const iotaClient = useIotaClient();
    const queryClient = useQueryClient();
    const account = useCurrentAccount();
    const timeRemaining = getTimeRemaining(auction.metadata);

    const { data: claimTransaction, isLoading: isClaimTransactionLoading } =
        useClaimAuctionTransaction(account?.address || '', auction.name);
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const { mutateAsync: handleClaim, isPending: isSigningClaimTransaction } = useMutation({
        async mutationFn(claimAuctionTransaction: Transaction) {
            const transactionResult = await signAndExecuteTransaction({
                transaction: claimAuctionTransaction,
            });

            await iotaClient.waitForTransaction({
                digest: transactionResult.digest,
            });
        },
        onSuccess() {
            queryClient.invalidateQueries({
                queryKey: queryKey.userAuctionHistory(account?.address),
            });
            // Invalidate auction so that it is detected as claimed
            queryClient.invalidateQueries({ queryKey: queryKey.auctionMetadata(auction.name) });
            // Refresh owned names so the claimed name appears
            queryClient.invalidateQueries({
                queryKey: queryKey.ownedObjects(account?.address || ''),
            });
        },
    });
    if (auctionStatus === 'claimable') {
        const isClaimLoading = isSigningClaimTransaction || isClaimTransactionLoading;

        return (
            <Button
                text={isSigningClaimTransaction ? 'Claiming...' : 'Claim'}
                icon={isClaimLoading ? <LoadingIndicator /> : null}
                onClick={() => {
                    if (claimTransaction?.transaction) {
                        handleClaim(claimTransaction.transaction);
                    }
                }}
                disabled={isSigningClaimTransaction || !claimTransaction?.transaction}
                fullWidth
            />
        );
    }

    if (['outbid', 'top_bidder'].includes(auctionStatus) && timeRemaining > 0) {
        return (
            <Button
                text="Bid Again"
                onClick={() => {
                    if (onBidClick) {
                        onBidClick(auction.name);
                    }
                }}
                fullWidth
            />
        );
    }

    return null;
}
