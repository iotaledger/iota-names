// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { NANOS_PER_IOTA } from '@iota/iota-sdk/utils';

import { AuctionFieldBcs } from './bcs';

export interface AuctionMetadata {
    domainName: string;
    startTimestamp: Date;
    endTimestamp: Date;
    winner: string;
    currentBidNanos: bigint;
    minBidNanos: bigint;
    nftId: string;
    nftExpiration: Date;
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

    const currentBidNanos = BigInt(auction.current_bid.balance.value || BigInt(0));
    const minBidNanos = currentBidNanos + NANOS_PER_IOTA;

    return {
        domainName: auction.nft.domain_name,
        startTimestamp: new Date(Number(auction.start_timestamp_ms)),
        endTimestamp: new Date(Number(auction.end_timestamp_ms)),
        winner: auction.winner,
        currentBidNanos,
        minBidNanos,
        nftId: auction.nft.id,
        nftExpiration: new Date(Number(auction.nft.expiration_timestamp_ms)),
    };
}

/**
 * Type guard to check if auction data exists and is valid
 */
export function isValidAuction(auction: AuctionMetadata | null): auction is AuctionMetadata {
    return auction !== null && auction.domainName.length > 0;
}
