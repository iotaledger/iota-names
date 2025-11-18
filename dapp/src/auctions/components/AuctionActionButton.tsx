// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Button, ButtonType, LoadingIndicator } from '@iota/apps-ui-kit';
import { ConnectModal, useCurrentAccount } from '@iota/dapp-kit';
import { useQueryClient } from '@tanstack/react-query';

import { queryKey } from '@/hooks/queryKey';

import { AuctionDetails } from '../hooks/useAuctions';
import { useClaimAuctionTransaction } from '../hooks/useClaimAuctionTransaction';
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
    const queryClient = useQueryClient();
    const account = useCurrentAccount();
    const timeRemaining = getTimeRemaining(auction.metadata);

    const { mutateAsync: claimTransaction, isPending: isSigningClaimTransaction } =
        useClaimAuctionTransaction(account?.address || '', auction.name, {
            onSuccess() {
                queryClient.invalidateQueries({
                    queryKey: queryKey.userAuctionHistory(account?.address),
                });
                queryClient.invalidateQueries({ queryKey: queryKey.auctionMetadata(auction.name) });
                queryClient.invalidateQueries({
                    queryKey: queryKey.ownedObjects(account?.address || ''),
                });
            },
        });

    if (!account?.address && auction.metadata?.isActive) {
        return (
            <ConnectModal trigger={<Button text="Bid" type={ButtonType.Outlined} fullWidth />} />
        );
    }

    if (auctionStatus === 'claimable' && auction.metadata?.winner === account?.address) {
        const isClaimLoading = isSigningClaimTransaction;

        return (
            <Button
                text={isSigningClaimTransaction ? undefined : 'Claim'}
                icon={isClaimLoading ? <LoadingIndicator /> : null}
                onClick={async () => {
                    await claimTransaction();
                }}
                disabled={isSigningClaimTransaction}
                fullWidth
            />
        );
    }

    if (['top_bidder'].includes(auctionStatus) && timeRemaining > 0) {
        return (
            <Button
                text="Bid Again"
                type={ButtonType.Outlined}
                onClick={() => {
                    if (onBidClick) {
                        onBidClick(auction.name);
                    }
                }}
                fullWidth
            />
        );
    }

    if (['outbid'].includes(auctionStatus) && timeRemaining > 0) {
        return (
            <Button
                text="Bid"
                type={ButtonType.Outlined}
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
