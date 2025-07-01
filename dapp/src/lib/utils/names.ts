// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { isSubName, NameRecord } from '@iota/iota-names-sdk';

import { RegistrationNft } from '../interfaces/registration.interfaces';

export function isNameRecordExpired(nameRecord: NameRecord) {
    return nameRecord.expirationTimestampMs < Date.now();
}

export function getNamePermissions(nameRecord: NameRecord) {
    const isSubname = isSubName(nameRecord.name);
    // Names are allowed always
    let allowChildCreation = !isSubname;
    let allowTimeExtension = !isSubname;
    // But subdomains need their permissions checked
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
export function getParentObjectId(
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
 * Get the parent object of a given name or subname
 */
export function getParentObject(
    ownedNames: RegistrationNft[],
    ownedSubdomains: RegistrationNft[],
    name: string,
) {
    const parts = name.split('.');
    const parentName = parts.slice(1).join('.');
    const names = isSubName(parentName) ? ownedSubdomains : ownedNames;
    const parent = names.find(({ name }) => name === parentName);
    return parent || null;
}

/**
 * Get object id of a given name or subname
 */
export function getNameObject(
    ownedNames: RegistrationNft[],
    ownedSubdomains: RegistrationNft[],
    name: string,
) {
    const names = isSubName(name) ? ownedSubdomains : ownedNames;
    const nameObject = names.find((domain: { name: string | null }) => domain.name === name);
    return nameObject?.id || null;
}
