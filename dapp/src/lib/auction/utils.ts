// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@iota/iota-sdk/bcs';
import { blake2b } from '@noble/hashes/blake2';
import { bytesToHex } from '@noble/hashes/utils';
import { useMemo } from 'react';

import { NameRecordData, useNameRecord } from '@/hooks';

import { getNamePermissions } from '../utils/names';
import { DomainBcs } from './bcs';

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

function getSubdomainLevel(name: string): number {
    const parts = name.split('.');
    return Math.max(0, parts.length - 2);
}

function getDirectParent(name: string): string | null {
    const parts = name.split('.');
    if (parts.length <= 2) {
        return null;
    }
    return parts.slice(1).join('.');
}
/**
 * Helper function to validate subdomain permissions based on hierarchical inheritance rules.
 *
 * - Root domains (domain.iota): Cannot configure permissions (always implicitly enabled)
 * - First-level subdomains (sub.domain.iota): Can configure permissions freely
 * - Deep subdomains (test.sub.domain.iota): Must respect parent's permission restrictions
 *
 * For deep subdomains, if a parent has a permission disabled (e.g., allowTimeExtension: false),
 * the child subdomain cannot enable that permission, ensuring hierarchical permission inheritance.
 *
 * @param fullSubdomainName - The complete subdomain name to validate (e.g., "test.sub.domain.iota")
 * @returns Parent permissions: canModifyTimeExtension and canModifyChildCreation
 */
export function useSubdomainPermissionsValidation(fullSubdomainName: string) {
    const subdomainLevel = getSubdomainLevel(fullSubdomainName);
    const directParent = getDirectParent(fullSubdomainName);

    const { data: parentNameRecord } = useNameRecord(directParent || '');

    const { data } =
        subdomainLevel >= 2 ? useNameRecord(directParent!) : useNameRecord(fullSubdomainName);
    const nameRecord = data as Extract<NameRecordData, { type: 'unavailable' }> | undefined;

    const parentPermissions =
        parentNameRecord && nameRecord?.nameRecord
            ? getNamePermissions(nameRecord.nameRecord)
            : undefined;

    const canModifyTimeExtension = useMemo(() => {
        if (subdomainLevel === 0) return false;
        if (subdomainLevel === 1) return true;
        if (subdomainLevel >= 2) {
            if (!parentPermissions) return false;
            return parentPermissions.allowTimeExtension === true;
        }

        return false;
    }, [fullSubdomainName, subdomainLevel, directParent, parentPermissions]);

    const canModifyChildCreation = useMemo(() => {
        if (subdomainLevel === 0) return false;
        if (subdomainLevel === 1) return true;
        if (subdomainLevel >= 2) {
            if (!parentPermissions) return false;
            return parentPermissions?.allowChildCreation === true;
        }
        return false;
    }, [subdomainLevel, parentPermissions]);

    return {
        canModifyTimeExtension,
        canModifyChildCreation,
    };
}
