// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Clock, IotaLogoSmall } from '@iota/apps-ui-icons';
import { Card, CardType, Divider, DividerType } from '@iota/apps-ui-kit';
import { useCurrentAccount } from '@iota/dapp-kit';
import { normalizeIotaName } from '@iota/iota-names-sdk';

import {
    AuctionDetails,
    formatTimeRemaining,
    getTimeRemaining,
    getUserAuctionStatus,
} from '@/auctions';
import { useCountdown } from '@/auctions/hooks/useCountdown';
import { NameCard } from '@/components/name-card/NameCard';
import { NameCardBody } from '@/components/name-card/NameCardBody';
import { formatNanosToIota } from '@/lib/utils';
import { getNameDisplaySrc } from '@/lib/utils/displayImage';

import { AuctionActionButton } from './AuctionActionButton';

interface AuctionublicItemProps {
    auction: AuctionDetails;
    onBidClick: (name: string) => void;
}

export function AuctionPublicItem({ auction, onBidClick }: AuctionublicItemProps) {
    const auctionDisplayImage = auction.metadata?.nftExpiration
        ? getNameDisplaySrc(auction.name, auction.metadata.nftExpiration.getTime())
        : null;
    const account = useCurrentAccount();

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

    const auctionStatus = getUserAuctionStatus(auction.metadata, account?.address || '');
    const formattedPrice = formatNanosToIota(auction.metadata.currentBidNanos ?? BigInt(0));
    return (
        <NameCard name={auction.name} size="full" displaySrc={auctionDisplayImage}>
            <NameCardBody name={normalizeIotaName(auction.name)}>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-label-md text-names-neutral-50">Current Bid</div>
                        <div className="flex mt-1 items-center gap-2">
                            <div className="bg-names-solid-blue rounded-full w-5 h-5 flex items-center justify-center">
                                <IotaLogoSmall className="w-4 h-4" />
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-body-lg">{formattedPrice}</span>
                                {/* <span className="text-label-md text-names-neutral-70">
                            ${convertedToFiat.toString()}
                        </span> */}
                            </div>
                        </div>
                    </div>
                    <div>
                        <AuctionActionButton
                            auction={auction}
                            auctionStatus={auctionStatus}
                            onBidClick={onBidClick}
                        />
                    </div>
                </div>
                <div className="my-4">
                    <Divider type={DividerType.Horizontal} />
                </div>
                <AuctionTimeRemaining auction={auction} />
            </NameCardBody>
        </NameCard>
    );
}

function AuctionTimeRemaining({ auction }: { auction: AuctionDetails }) {
    // Always call hooks at the top level - never inside conditions
    const timeRemainingMs = getTimeRemaining(auction.metadata);
    const { milliseconds } = useCountdown(timeRemainingMs);
    const formattedTimeRemaining = formatTimeRemaining(milliseconds);

    return (
        <div className="flex items-center justify-between">
            <div>
                <span className="text-label-md text-names-neutral-50">Time left</span>
            </div>
            <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-names-neutral-50" />
                <span className="text-label-md text-names-neutral-50">
                    {formattedTimeRemaining}
                </span>
            </div>
        </div>
    );
}
