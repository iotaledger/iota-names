// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { NameRecord } from '@iota/iota-names-sdk';

import { RegistrationNft } from '../interfaces/registration.interfaces';

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
