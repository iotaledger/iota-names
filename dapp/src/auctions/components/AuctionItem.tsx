// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Button, Card, CardType, KeyValueInfo, LoadingIndicator } from '@iota/apps-ui-kit';
import { useCurrentAccount, useIotaClient, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { Transaction } from '@iota/iota-sdk/transactions';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKey } from '@/hooks/queryKey';
import { formatNanosToIota } from '@/lib/utils';

import { useClaimAuctionTransaction } from '../hooks/useClaimAuctionTransaction';
import { AuctionDetails } from '../hooks/useGetUserAuctions';
import {
    formatTimeRemaining,
    getCurrentBidAmount,
    getNextBidAmount,
    getTimeRemaining,
    UserAuctionStatus,
} from '../lib/utils';
import { AuctionStatusBadge } from './AuctionStatusBadge';

interface AuctionItemProps {
    auction: AuctionDetails;
    auctionStatus: UserAuctionStatus;
    onBidClick?: (targetName: string) => void;
}

export function AuctionItem({ auction, auctionStatus, onBidClick }: AuctionItemProps) {
    const iotaClient = useIotaClient();
    const queryClient = useQueryClient();
    const account = useCurrentAccount();

    const { data: claimTransaction, isLoading: isClaimTransactionLoading } =
        useClaimAuctionTransaction(account?.address || '', auction.domain);

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
            queryClient.invalidateQueries({ queryKey: queryKey.auctionMetadata(auction.domain) });
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
                    <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded dark:bg-gray-700 w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded dark:bg-gray-700 w-full"></div>
                </div>
            </Card>
        );
    }

    if (auction.error || !auction.metadata) {
        return (
            <Card type={CardType.Filled}>
                <div className="text-red-600 dark:text-red-400">
                    <p className="font-medium">{auction.domain}</p>
                    <p className="text-sm">Failed to load auction data</p>
                </div>
            </Card>
        );
    }

    const currentBid = getCurrentBidAmount(auction.metadata);
    const timeRemaining = getTimeRemaining(auction.metadata);
    const nextBidAmount = getNextBidAmount(auction.metadata);

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
                />
            );
        }

        if (auctionStatus === 'outbid' && timeRemaining > 0) {
            return (
                <Button
                    text="Bid Again"
                    onClick={() => {
                        if (onBidClick) {
                            onBidClick(auction.domain);
                        }
                    }}
                />
            );
        }

        return null;
    };

    return (
        <Card type={CardType.Filled}>
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-medium text-lg">{auction.domain}</h3>
                    <AuctionStatusBadge status={auctionStatus} />
                </div>

                <div className="space-y-2">
                    <KeyValueInfo
                        keyText="Current Bid"
                        value={formatNanosToIota(currentBid, {
                            formatRounded: false,
                            showIotaSymbol: false,
                        })}
                        fullwidth
                    />
                    <KeyValueInfo
                        keyText="Time Remaining"
                        value={formatTimeRemaining(timeRemaining)}
                        fullwidth
                    />
                    {auctionStatus === 'outbid' && timeRemaining > 0 && (
                        <KeyValueInfo
                            keyText="Next Bid"
                            value={formatNanosToIota(nextBidAmount, {
                                formatRounded: false,
                                showIotaSymbol: false,
                            })}
                            fullwidth
                        />
                    )}
                </div>

                <div className="pt-2">{renderActionButton()}</div>
            </div>
        </Card>
    );
}
