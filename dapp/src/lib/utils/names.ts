// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { NameRecord } from '@iota/iota-names-sdk';

import { RegistrationNft } from '@/hooks';

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

/**
 * Get the parent object id of a given subndomain
 */
export function getParentSubdomainObjectId(
    ownedNames: RegistrationNft[],
    ownedSubdomains: RegistrationNft[],
    name: string,
) {
    const parts = name.split('.');
    const parentName = parts.slice(1).join('.');
    const parentParts = parentName?.split('.').length;

    if (parentParts === 2) {
        // Subdomains with names as parent
        const parentDomain = ownedNames.find(({ name }) => name === parentName);
        return parentDomain?.id || null;
    } else if (parentParts && parentParts >= 3) {
        // Subdomains with another subdomain as parent
        const parentSubdomain = ownedSubdomains.find(({ name }) => name === parentName);
        return parentSubdomain?.id || null;
    }
}
