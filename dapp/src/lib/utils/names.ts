// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { isSubName, NameRecord } from '@iota/iota-names-sdk';

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
 * Get the root object of a given subdomain
 */
export function getRootObject(ownedNames: RegistrationNft[], name: string) {
    const parts = name.split('.');
    const parentName = parts.slice(-2).join('.');
    const parent = ownedNames.find(({ name }) => name === parentName);
    return parent || null;
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
