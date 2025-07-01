// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@iota/iota-sdk/bcs';
import { NANOS_PER_IOTA } from '@iota/iota-sdk/utils';
import { blake2b } from '@noble/hashes/blake2';
import { bytesToHex } from '@noble/hashes/utils';

import { DomainBcs } from './bcs';
import { AuctionMetadata } from './types';

/**
 * Derives an auction dynamic field object ID.
 * Based on https://github.com/iotaledger/iota/blob/797355f33d982eb90b59542c4bceb0b1c6f8145f/crates/iota/src/name_commands.rs#L2086
 * @param parentObjectId - The parent object ID (the ID of the 'auction' LinkedTable field in the AuctionHouse struct).
 * @param tag - The Domain type tag as a string (e.g., "0x123::domain::Domain")
 * @param domain - The domain name object.
 * @returns The derived object ID as a hex string
 */
export function deriveAuctionDynamicFieldId(
    parentObjectId: string,
    tag: string,
    domain: { labels: string[] },
): string {
    const domainBcsBytes = DomainBcs.serialize(domain).toBytes();
    const typeTagBytes = bcs.TypeTag.serialize(tag).toBytes();

    const domainBcsBytesLen = new Uint8Array(8);
    const view = new DataView(domainBcsBytesLen.buffer);
    view.setUint32(0, domainBcsBytes.length, true); // little-endian

    const input = new Uint8Array([
        // HashingIntentScope::ChildObjectId
        0xf0,
        ...bcs.Address.serialize(parentObjectId).toBytes(),
        ...domainBcsBytesLen,
        ...domainBcsBytes,
        ...typeTagBytes,
    ]);

    const hash = blake2b(input, { dkLen: 32 });

    return `0x${bytesToHex(hash)}`;
}

/**
 * Helper function to create a domain object from a domain name string
 * Note: The labels are stored in reverse order according to Domain struct
 * https://github.com/iotaledger/iota/blob/797355f33d982eb90b59542c4bceb0b1c6f8145f/crates/iota-names/src/domain.rs#L19
 * @param domainName - Domain name like "rust.iota"
 * @returns Domain object with labels in reverse order
 */
export function createDomainFromName(domainName: string): { labels: string[] } {
    const labels = domainName.split('.');
    return { labels: labels.reverse() };
}

export type AuctionStatus = 'active' | 'ended' | 'not_found';

export type UserAuctionStatus =
    | 'top_bidder'
    | 'outbid'
    | 'winner'
    | 'lost'
    | 'claimable'
    | 'unknown';

export function isAuctionActive(auction: AuctionMetadata | null): boolean {
    if (!auction) return false;

    const now = Date.now();
    return now < auction.endTimestamp.getTime();
}

export function isAuctionEnded(auction: AuctionMetadata | null): boolean {
    if (!auction) return false;

    const now = Date.now();
    return now >= auction.endTimestamp.getTime();
}

export function getAuctionStatus(auction: AuctionMetadata | null): AuctionStatus {
    if (!auction) return 'not_found';

    if (isAuctionActive(auction)) return 'active';
    return 'ended';
}

export function isUserWinner(auction: AuctionMetadata | null, userAddress: string): boolean {
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

export function getCurrentBidAmount(auction: AuctionMetadata | null): bigint {
    if (!auction) return BigInt(0);

    return auction.currentBidNanos;
}

export function getTimeRemaining(auction: AuctionMetadata | null): number {
    if (!auction) return 0;

    const now = Date.now();
    return Math.max(0, auction.endTimestamp.getTime() - now);
}

export function formatTimeRemaining(milliseconds: number): string {
    if (milliseconds <= 0) return 'Ended';

    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

export function getNextBidAmount(auction: AuctionMetadata | null): bigint {
    const currentBid = getCurrentBidAmount(auction);
    const oneIotaInNanos = BigInt(1) * NANOS_PER_IOTA;

    return currentBid + oneIotaInNanos;
}
