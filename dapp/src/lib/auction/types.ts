// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { AuctionFieldBcs } from './bcs';

export interface AuctionMetadata {
    domainName: string;
    startTimestampMs: number;
    endTimestampMs: number;
    winner: string;
    currentBidNanos: bigint;
    nftId: string;
    nftExpirationMs: number;
}

/**
 * Raw auction metadata type from BCS parsing
 */
export type RawAuctionMetadata = ReturnType<typeof AuctionFieldBcs.parse> | null;

/**
 * Converts raw BCS auction data to normalized TypeScript interface
 */
export function normalizeAuctionData(rawData: RawAuctionMetadata): AuctionMetadata | null {
    if (!rawData?.value?.value) {
        return null;
    }

    const auction = rawData.value.value;

    return {
        domainName: auction.nft.domain_name,
        startTimestampMs: Number(auction.start_timestamp_ms),
        endTimestampMs: Number(auction.end_timestamp_ms),
        winner: auction.winner,
        currentBidNanos: BigInt(auction.current_bid.balance.value),
        nftId: auction.nft.id,
        nftExpirationMs: Number(auction.nft.expiration_timestamp_ms),
    };
}

/**
 * Type guard to check if auction data exists and is valid
 */
export function isValidAuction(auction: AuctionMetadata | null): auction is AuctionMetadata {
    return auction !== null && auction.domainName.length > 0;
}
