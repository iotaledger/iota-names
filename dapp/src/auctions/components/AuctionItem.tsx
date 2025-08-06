// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Button, Card, CardType, LoadingIndicator } from '@iota/apps-ui-kit';
import { useCurrentAccount, useIotaClient, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { normalizeIotaName } from '@iota/iota-names-sdk';
import { Transaction } from '@iota/iota-sdk/transactions';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { NameCard } from '@/components/name-card/NameCard';
import { NameCardBody } from '@/components/name-card/NameCardBody';
import { ExpiryDateIndicator } from '@/components/name-card/NameCardIndicators';
import { queryKey } from '@/hooks/queryKey';

import { getNameDisplaySrc } from '../../lib/utils/displayImage';
import { useClaimAuctionTransaction } from '../hooks/useClaimAuctionTransaction';
import { AuctionDetails } from '../hooks/useGetUserAuctions';
import { AuctionStatusBadge } from './AuctionStatusBadge';

interface AuctionItemProps {
    auction: AuctionDetails;
    onBidClick?: (targetName: string) => void;
}

export function AuctionItem({ auction, onBidClick }: AuctionItemProps) {
    const iotaClient = useIotaClient();
    const queryClient = useQueryClient();
    const account = useCurrentAccount();

    const { data: claimTransaction, isLoading: isClaimTransactionLoading } =
        useClaimAuctionTransaction(account?.address || '', auction.name);

    const auctionDisplayImage = auction.metadata?.nftExpiration
        ? getNameDisplaySrc(auction.name, auction.metadata.nftExpiration.getTime())
        : null;

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

    if (!auction.metadata || auction.isLoading) {
        return (
            <Card type={CardType.Filled}>
                <div className="animate-pulse space-y-3">
                    <div className="h-4 rounded bg-gray-700 w-3/4"></div>
                    <div className="h-3 rounded bg-gray-700 w-1/2"></div>
                    <div className="h-3 rounded bg-gray-700 w-full"></div>
                </div>
            </Card>
        );
    }

    if (auction.error || !auction.metadata) {
        return (
            <Card type={CardType.Filled}>
                <div className="text-red-400">
                    <p className="font-medium">{auction.name}</p>
                    <p className="text-sm">Failed to load auction data</p>
                </div>
            </Card>
        );
    }

    const timeRemaining = auction.metadata.getTimeRemaining();
    const auctionStatus = auction.metadata?.getUserStatus(account?.address || '');

    const renderActionButton = () => {
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

        if ((auctionStatus == 'outbid' || auctionStatus == 'top_bidder') && timeRemaining > 0) {
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
    };

    return (
        <NameCard name={auction.name} displaySrc={auctionDisplayImage}>
            <NameCardBody name={normalizeIotaName(auction.name)}>
                <div className="flex flex-row items-center justify-between gap-x-xs">
                    <ExpiryDateIndicator auctionMetadata={auction.metadata} />
                    <AuctionStatusBadge status={auctionStatus} />
                </div>

                <div className="min-h-[44px] flex w-full">{renderActionButton()}</div>
            </NameCardBody>
        </NameCard>
    );
}
