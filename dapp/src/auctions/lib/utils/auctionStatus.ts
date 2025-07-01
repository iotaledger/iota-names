// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { AuctionMetadata } from '../types/metadata';

export type AuctionStatus = 'active' | 'ended' | 'not_found';

export type UserAuctionStatus =
    | 'top_bidder'
    | 'outbid'
    | 'winner'
    | 'lost'
    | 'claimable'
    | 'unknown';

function isAuctionActive(auction: AuctionMetadata | null): boolean {
    if (!auction) return false;

    const now = Date.now();
    return now < auction.endTimestamp.getTime();
}

function getAuctionStatus(auction: AuctionMetadata | null): AuctionStatus {
    if (!auction) return 'not_found';

    if (isAuctionActive(auction)) return 'active';
    return 'ended';
}

function isUserWinner(auction: AuctionMetadata | null, userAddress: string): boolean {
    if (!auction || !userAddress) return false;

    return auction.winner === userAddress;
}

export function getUserAuctionStatus(
    auction: AuctionMetadata | null,
    userAddress: string,
): UserAuctionStatus {
    if (!auction || !userAddress) return 'unknown';

    const isWinner = isUserWinner(auction, userAddress);
    const auctionStatus = getAuctionStatus(auction);

    if (auctionStatus === 'active') {
        return isWinner ? 'top_bidder' : 'outbid';
    } else if (auctionStatus === 'ended') {
        if (isWinner) {
            // TODO: Do we need to check if it was already claimed ?
            return 'claimable';
        } else {
            return 'lost';
        }
    }

    return 'unknown';
}
