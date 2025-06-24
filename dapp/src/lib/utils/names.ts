// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { NameRecord } from '@iota/iota-names-sdk';
import { useMemo } from 'react';

import { NameRecordData, useNameRecord } from '@/hooks';

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
 * Finds all subdomains that belong to a specific parent domain (including all nested levels).
 *
 * Example: 'test.domain.iota' → finds ['app.test.domain.iota', 'blog.test.domain.iota', 'deep.app.test.domain.iota', etc.]
 *
 * @param parentDomain - The parent domain name (e.g., "test.domain.iota")
 * @param subdomainsOwned - Array of all owned subdomains
 * @returns Array of ALL subdomain objects that are descendants of the parent domain
 */
export function findChildSubdomains(parentDomain: string, subdomainsOwned: any[]): any[] {
    return subdomainsOwned.filter((subdomain) => {
        const endsWithParent = subdomain.name.endsWith('.' + parentDomain);
        return endsWithParent;
    });
}
