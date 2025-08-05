// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { AuctionFieldBcs } from './bcs';

export type RawAuctionMetadata = ReturnType<typeof AuctionFieldBcs.parse> | null;

export interface AuctionMetadata {
    name: string;
    startTimestamp: Date;
    endTimestamp: Date;
    winner: string;
    currentBidNanos: bigint;
    minBidNanos: bigint;
    nftId: string;
    nftExpiration: Date;
    getCurrentBidAmount(): bigint;
    getNextBidAmount(): bigint;
    getTimeRemaining(): number;
    isAuctionActive(): boolean;
    getAuctionMetadataStatus(): AuctionMetadataStatus;
    isUserWinner(address: string): boolean;
    getUserAuctionStatus(address: string): UserAuctionStatus;
}

export type AuctionMetadataStatus = 'active' | 'ended' | 'not_found';

export type UserAuctionStatus =
    | 'top_bidder'
    | 'outbid'
    | 'winner'
    | 'lost'
    | 'claimable'
    | 'claimed'
    | 'unknown';
