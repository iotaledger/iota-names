// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Button, Card, CardType, KeyValueInfo } from '@iota/apps-ui-kit';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { NANOS_PER_IOTA } from '@iota/iota-sdk/utils';
import { useState } from 'react';

import { useClaimAuctionTransaction } from '../hooks/useClaimAuctionTransaction';
import { AuctionDetails } from '../hooks/useGetUserAuctions';
import {
    formatTimeRemaining,
    getCurrentBidAmount,
    getNextBidAmount,
    getTimeRemaining,
    getUserAuctionStatus,
} from '../lib/utils';
import { AuctionStatusBadge } from './AuctionStatusBadge';

interface AuctionItemProps {
    auction: AuctionDetails;
    onBidClick?: (domain: string, bidAmount: bigint) => void;
}

export function AuctionItem({ auction, onBidClick }: AuctionItemProps) {
    const account = useCurrentAccount();
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const [isClaimLoading, setIsClaimLoading] = useState(false);

    const { data: claimTxData } = useClaimAuctionTransaction(
        account?.address || '',
        auction.domain,
    );

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

    const userStatus = getUserAuctionStatus(auction.metadata, account?.address || '');
    const currentBid = getCurrentBidAmount(auction.metadata);
    const timeRemaining = getTimeRemaining(auction.metadata);
    const nextBidAmount = getNextBidAmount(auction.metadata);

    const formatBidAmount = (nanos: bigint) => {
        const iota = Number(nanos) / Number(NANOS_PER_IOTA);
        return `${iota.toLocaleString()} IOTA`;
    };

    const handleClaimClick = async () => {
        if (!claimTxData?.transaction) return;

        setIsClaimLoading(true);
        try {
            await signAndExecuteTransaction({
                transaction: claimTxData.transaction,
            });
        } catch (error) {
            console.error('Failed to claim auction:', error);
        } finally {
            setIsClaimLoading(false);
        }
    };

    const handleBidClick = () => {
        if (onBidClick) {
            onBidClick(auction.domain, nextBidAmount);
        }
    };

    const renderActionButton = () => {
        if (userStatus === 'claimable') {
            return (
                <Button
                    text={isClaimLoading ? 'Claiming...' : 'Claim'}
                    onClick={handleClaimClick}
                    disabled={isClaimLoading || !claimTxData?.transaction}
                />
            );
        }

        if (userStatus === 'outbid' && timeRemaining > 0) {
            return <Button text="Bid Again" onClick={handleBidClick} />;
        }

        return null;
    };

    return (
        <Card type={CardType.Filled}>
            <div className="space-y-3">
                {/* Domain name and status */}
                <div className="flex items-center justify-between">
                    <h3 className="font-medium text-lg">{auction.domain}</h3>
                    <AuctionStatusBadge status={userStatus} />
                </div>

                {/* Auction details */}
                <div className="space-y-2">
                    <KeyValueInfo
                        keyText="Current Bid"
                        value={formatBidAmount(currentBid)}
                        fullwidth
                    />
                    <KeyValueInfo
                        keyText="Time Remaining"
                        value={formatTimeRemaining(timeRemaining)}
                        fullwidth
                    />
                    {userStatus === 'outbid' && timeRemaining > 0 && (
                        <KeyValueInfo
                            keyText="Next Bid"
                            value={formatBidAmount(nextBidAmount)}
                            fullwidth
                        />
                    )}
                </div>

                <div className="pt-2">{renderActionButton()}</div>
            </div>
        </Card>
    );
}
