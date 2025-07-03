// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { isSubname, NameRecord } from '@iota/iota-names-sdk';

import { RegistrationNft } from '@/hooks';

export function isNameRecordExpired(nameRecord: NameRecord) {
    return nameRecord.expirationTimestampMs < Date.now();
}

export function getNamePermissions(nameRecord: NameRecord) {
    const isNameSubname = isSubname(nameRecord.name);
    // Names are allowed always
    let allowChildCreation = !isNameSubname;
    let allowTimeExtension = !isNameSubname;
    // But subnames need their permissions checked
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
 * Get the parent object id of a given subname
 */
export function getParentObjectId(
    ownedNames: RegistrationNft[],
    ownedSubnames: RegistrationNft[],
    name: string,
) {
    const parts = name.split('.');
    const parentName = parts.slice(1).join('.');
    const parentParts = parentName?.split('.').length;

    // 2 parts names are names, the rest are subnames
    const parentNames = parentParts === 2 ? ownedNames : ownedSubnames;

    const parent = parentNames.find(({ name }) => name === parentName);
    return parent?.id || null;
}

/**
 * Get object id of a given subname
 */
export function getSubnameObjectId(ownedSubnames: RegistrationNft[], name: string) {
    const subname = ownedSubnames.find((subname: { name: string | null }) => subname.name === name);
    return subname?.id || null;
}
