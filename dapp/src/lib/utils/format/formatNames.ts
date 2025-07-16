// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export function splitNameParts(nftName: string) {
    const parts = denormalizeName(nftName).split('.');
    const lastIndex = parts.length - 1;
    const parentName = parts[lastIndex];

    return {
        parentName,
        subname: parts.slice(0, lastIndex).join('.'),
    };
}

export function normalizeName(name: string) {
    return name.endsWith('.iota') ? name : `${name}.iota`;
}

export function denormalizeName(name: string) {
    return name.toLowerCase().replace(/\.iota$/i, '');
}

export function formatNameLabel(name: string, onlyFirstSubname = false) {
    const { parentName, subname } = splitNameParts(name);

    return subname
        ? `${onlyFirstSubname ? subname.split('.')[0] : subname}@${parentName}`
        : `@${parentName}`;
}
