// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Title, TitleSize } from '@iota/apps-ui-kit';
import { useCurrentAccount } from '@iota/dapp-kit';
import { useState } from 'react';

import { AuctionDetails, useGetUserAuctions } from '../hooks/useGetUserAuctions';
import { getUserAuctionStatus } from '../lib/utils';
import { AuctionItem } from './AuctionItem';
import { AuctionBidDialog } from './dialogs/AuctionBidDialog';

export function UserAuctions() {
    const account = useCurrentAccount();
    const { data: auctionDetails, isLoading, error } = useGetUserAuctions();
    const [bidDialogState, setBidDialogState] = useState<{
        domain: string;
        bidAmount: bigint;
    } | null>(null);

    if (isLoading) {
        return (
            <div className="w-full space-y-4">
                <Title title="My Auctions" size={TitleSize.Small} />
                <div className="animate-pulse space-y-4">
                    <div className="h-32 bg-gray-200 rounded-lg dark:bg-gray-700"></div>
                    <div className="h-32 bg-gray-200 rounded-lg dark:bg-gray-700"></div>
                    <div className="h-32 bg-gray-200 rounded-lg dark:bg-gray-700"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full space-y-4">
                <Title title="My Auctions" size={TitleSize.Small} />
                <div className="rounded-lg border border-red-200 p-6 dark:border-red-800">
                    <p className="text-red-600 dark:text-red-400">
                        Failed to load auctions. Please try again later.
                    </p>
                </div>
            </div>
        );
    }

    if (!auctionDetails || auctionDetails.length === 0) {
        return (
            <div className="w-full space-y-4">
                <Title title="My Auctions" size={TitleSize.Small} />
                <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400">
                        You haven't participated in any auctions yet.
                    </p>
                </div>
            </div>
        );
    }

    const groupedAuctions = auctionDetails.reduce(
        (groups, auction) => {
            const status = getUserAuctionStatus(auction.metadata, account?.address || '');

            if (status === 'top_bidder' || status === 'outbid') {
                groups.active.push(auction);
            } else if (status === 'claimable' || status === 'winner') {
                groups.claimable.push(auction);
            } else if (status === 'lost') {
                groups.lost.push(auction);
            }

            return groups;
        },
        {
            active: [] as AuctionDetails[],
            claimable: [] as AuctionDetails[],
            lost: [] as AuctionDetails[],
        },
    );

    const handleBidClick = (domain: string, bidAmount: bigint) => {
        setBidDialogState({ domain, bidAmount });
    };

    return (
        <div className="w-full space-y-6">
            <Title title="My Auctions" size={TitleSize.Small} />

            {groupedAuctions.active.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">
                        Active Auctions ({groupedAuctions.active.length})
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {groupedAuctions.active.map((auction) => (
                            <AuctionItem
                                key={auction.domain}
                                auction={auction}
                                onBidClick={handleBidClick}
                            />
                        ))}
                    </div>
                </div>
            )}

            {groupedAuctions.claimable.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">
                        Won Auctions ({groupedAuctions.claimable.length})
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {groupedAuctions.claimable.map((auction) => (
                            <AuctionItem
                                key={auction.domain}
                                auction={auction}
                                onBidClick={handleBidClick}
                            />
                        ))}
                    </div>
                </div>
            )}

            {groupedAuctions.lost.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">
                        Lost Auctions ({groupedAuctions.lost.length})
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {groupedAuctions.lost.map((auction) => (
                            <AuctionItem
                                key={auction.domain}
                                auction={auction}
                                onBidClick={handleBidClick}
                            />
                        ))}
                    </div>
                </div>
            )}

            {bidDialogState && (
                <AuctionBidDialog
                    name={bidDialogState.domain}
                    setOpen={(open) => {
                        if (!open) setBidDialogState(null);
                    }}
                />
            )}
        </div>
    );
}
