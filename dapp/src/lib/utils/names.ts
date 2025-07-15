// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { GRACE_PERIOD_MS, isSubname, NameRecord } from '@iota/iota-names-sdk';

import { RegistrationNft } from '../interfaces/registration.interfaces';

export function isNameRecordExpired(nameRecord: NameRecord) {
    return nameRecord.expirationTimestampMs < Date.now();
}

export function isGracePeriodExpired(nameRecord: NameRecord) {
    return nameRecord.expirationTimestampMs + GRACE_PERIOD_MS < Date.now();
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
 * Get the parent object of a given name or subname
 */
export function getParentObject(
    ownedNames: RegistrationNft[],
    ownedSubnames: RegistrationNft[],
    name: string,
) {
    const parts = name.split('.');
    const parentName = parts.slice(1).join('.');
    const names = isSubname(parentName) ? ownedSubnames : ownedNames;
    const parent = names.find(({ name }) => name === parentName);
    return parent || null;
}

/**
 * Get object id of a given name or subname
 */
export function getNameObject(names: RegistrationNft[], name: string) {
    const nameObject = names.find((domain: { name: string | null }) => domain.name === name);
    return nameObject?.id || null;
}

/**
 * Get the maximum number of years to renew a name.
 * Returns 0 if the name is not renewable for more time.
 */
export function getYearsToRenew(max_years: number, expirationTimestampMs: number): number {
    if (!expirationTimestampMs) return 0;
    for (let years = 6; years >= 0; years--) {
        const newExpirationTime = expirationTimestampMs + years * 365 * 24 * 60 * 60 * 1000;
        const maxRenewalTime = Date.now() + (max_years + 1) * 365 * 24 * 60 * 60 * 1000;
        if (newExpirationTime < maxRenewalTime) return years;
    }
    return 0;
}

/**
 * Check if a name is renewable for renewYears years.
 */
export function isNameRenewable(
    max_years: number,
    expirationTimestampMs: number,
    renewYears: number,
): boolean {
    if (!expirationTimestampMs || !renewYears) {
        return true;
    }
    const newExpirationTime = expirationTimestampMs + renewYears * 365 * 24 * 60 * 60 * 1000;
    const maxRenewalTime = Date.now() + (max_years + 1) * 365 * 24 * 60 * 60 * 1000;
    return newExpirationTime < maxRenewalTime;
}
