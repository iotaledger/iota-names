// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@iota/iota-sdk/bcs';
import { blake2b } from '@noble/hashes/blake2';
import { bytesToHex } from '@noble/hashes/utils';

import { DomainBcs } from '../types/bcs';

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
