// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { isSubName, NameRecord } from '@iota/iota-names-sdk';
import { useMemo } from 'react';

import { NameRecordData, RegistrationNft, useNameRecord } from '@/hooks';

export function isNameRecordExpired(nameRecord: NameRecord) {
    return nameRecord.expirationTimestampMs < Date.now();
}

export function getNamePermissions(nameRecord: NameRecord) {
    let allowChildCreation = false;
    let allowTimeExtension = false;
    if ('S_AC' in nameRecord.data) {
        allowChildCreation = nameRecord.data.S_AC === '1';
    }
    if ('S_ATE' in nameRecord.data) {
        allowTimeExtension = nameRecord.data.S_ATE === '1';
    }

    return {
        allowChildCreation,
        allowTimeExtension,
    };
}

export function getSubdomainLevel(name: string): number {
    const parts = name.split('.');
    return Math.max(0, parts.length - 2);
}

export function getDirectParent(name: string): string | null {
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

    const { data } =
        subdomainLevel >= 2 ? useNameRecord(directParent!) : useNameRecord(fullSubdomainName);
    const nameRecord = data as Extract<NameRecordData, { type: 'unavailable' }> | undefined;

    const parentPermissions = nameRecord?.nameRecord
        ? getNamePermissions(nameRecord.nameRecord)
        : undefined;

    const canModifyTimeExtension = useMemo(() => {
        if (subdomainLevel >= 2) {
            if (!parentPermissions) return false;
            return parentPermissions.allowTimeExtension;
        }

        return true;
    }, [subdomainLevel, parentPermissions]);

    const canModifyChildCreation = useMemo(() => {
        if (subdomainLevel >= 2) {
            if (!parentPermissions) return false;
            return parentPermissions?.allowChildCreation;
        }
        return true;
    }, [subdomainLevel, parentPermissions]);
    return {
        canModifyTimeExtension,
        canModifyChildCreation,
    };
}

/**
 * Get the parent object id of a given subdomain
 */
export function getParentSubdomainObjectId(
    ownedNames: RegistrationNft[],
    ownedSubdomains: RegistrationNft[],
    name: string,
) {
    const parts = name.split('.');
    const parentName = parts.slice(1).join('.');
    const parentParts = parentName?.split('.').length;

    // 2 parts domains are names, the rest are subdomains
    const parentNames = parentParts === 2 ? ownedNames : ownedSubdomains;

    const parent = parentNames.find(({ name }) => name === parentName);
    return parent?.id || null;
}
/**
 * Get object id of a given subdomain
 */
export function getSubdomainObjectId(
    ownedNames: RegistrationNft[],
    ownedSubdomains: RegistrationNft[],
    name: string,
) {
    if (!isSubName(name)) {
        const parentDomain = ownedNames.find(
            (domain: { name: string | null }) => domain.name === name,
        );
        return parentDomain?.id || null;
    } else {
        const parentSubdomain = ownedSubdomains.find(
            (subdomain: { name: string | null }) => subdomain.name === name,
        );
        return parentSubdomain?.id || null;
    }
}
