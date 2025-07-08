// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Title, TitleSize } from '@iota/apps-ui-kit';
import { useCurrentAccount } from '@iota/dapp-kit';
import { useState } from 'react';

import { AuctionDetails, useGetUserAuctions } from '../hooks/useGetUserAuctions';
import { getUserAuctionStatus, UserAuctionStatus } from '../lib/utils';
import { AuctionItem } from './AuctionItem';
import { AuctionBidDialog } from './dialogs/AuctionBidDialog';

type AuctionGroup = {
    details: AuctionDetails;
    status: UserAuctionStatus;
}[];

export function UserAuctions() {
    const account = useCurrentAccount();
    const { data: auctionDetails, isLoading, error } = useGetUserAuctions();
    const [bidDialogName, setBidDialogName] = useState<string | null>(null);

    if (isLoading || !account) {
        return (
            <div className="w-full space-y-4">
                <Title title="My Auctions" size={TitleSize.Small} />
                <div className="animate-pulse space-y-4">
                    <div className="h-32 rounded-lg bg-gray-700"></div>
                    <div className="h-32 rounded-lg bg-gray-700"></div>
                    <div className="h-32 rounded-lg bg-gray-700"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full space-y-4">
                <Title title="My Auctions" size={TitleSize.Small} />
                <div className="rounded-lg border p-6 border-red-800">
                    <p className="text-red-400">Failed to load auctions. Please try again later.</p>
                </div>
            </div>
        );
    }

    if (!auctionDetails || auctionDetails.length === 0) {
        return (
            <div className="w-full space-y-4">
                <Title title="My Auctions" size={TitleSize.Small} />
                <div className="rounded-lg border p-6 border-gray-700">
                    <p className="text-gray-400">You haven't participated in any auctions yet.</p>
                </div>
            </div>
        );
    }

    const groupedAuctions = auctionDetails.reduce(
        (groups, auctionDetails) => {
            const status = getUserAuctionStatus(auctionDetails.metadata, account.address);

            if (status === 'top_bidder' || status === 'outbid') {
                groups.active.push({ details: auctionDetails, status });
            } else if (status === 'claimable' || status === 'winner') {
                groups.claimable.push({ details: auctionDetails, status });
            } else if (status === 'lost') {
                groups.lost.push({ details: auctionDetails, status });
            }

            return groups;
        },
        {
            active: [] as AuctionGroup,
            claimable: [] as AuctionGroup,
            lost: [] as AuctionGroup,
        },
    );

    const handleBidClick = (targetName: string) => {
        setBidDialogName(targetName);
    };

    return (
        <div className="w-full space-y-6">
            <Title title="My Auctions" size={TitleSize.Small} />

            {groupedAuctions.active.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-md font-medium text-gray-100">
                        Active Auctions ({groupedAuctions.active.length})
                    </h4>
                    <div className="flex flex-row gap-md items-stretch justify-start flex-wrap">
                        {groupedAuctions.active.map((auctionGroup) => (
                            <AuctionItem
                                key={auctionGroup.details.name}
                                auction={auctionGroup.details}
                                auctionStatus={auctionGroup.status}
                                onBidClick={handleBidClick}
                            />
                        ))}
                    </div>
                </div>
            )}

            {groupedAuctions.claimable.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-md font-medium text-gray-100">
                        Won Auctions ({groupedAuctions.claimable.length})
                    </h4>
                    <div className="flex flex-row gap-md items-stretch justify-start flex-wrap">
                        {groupedAuctions.claimable.map((auctionGroup) => (
                            <AuctionItem
                                key={auctionGroup.details.name}
                                auction={auctionGroup.details}
                                auctionStatus={auctionGroup.status}
                                onBidClick={handleBidClick}
                            />
                        ))}
                    </div>
                </div>
            )}

            {groupedAuctions.lost.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-md font-medium text-gray-100">
                        Lost Auctions ({groupedAuctions.lost.length})
                    </h4>
                    <div className="flex flex-row gap-md items-stretch justify-start flex-wrap">
                        {groupedAuctions.lost.map((auctionGroup) => (
                            <AuctionItem
                                key={auctionGroup.details.name}
                                auction={auctionGroup.details}
                                auctionStatus={auctionGroup.status}
                                onBidClick={handleBidClick}
                            />
                        ))}
                    </div>
                </div>
            )}

            {bidDialogName && (
                <AuctionBidDialog
                    name={bidDialogName}
                    closeDialog={() => {
                        setBidDialogName(null);
                    }}
                />
            )}
        </div>
    );
}
