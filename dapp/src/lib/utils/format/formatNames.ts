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

const LONG_NAMES_TRUNCATE_LENGTH = 11;
const CHARACTERS_TO_SHOW = 6;
interface FormatNameOptions {
    onlyFirstSubname?: boolean;
    truncateLongParts?: boolean;
}
export function formatNameLabel(
    name: string,
    { onlyFirstSubname = false, truncateLongParts = false }: FormatNameOptions = {},
) {
    const { parentName, subname: subnamePart } = splitNameParts(name);

    const subnamesArr = subnamePart.split('.');
    let formattedName = parentName;
    let subname = onlyFirstSubname
        ? `${subnamesArr[0]}${subnamesArr.length > 1 ? '...' : ''}`
        : subnamePart;

    if (truncateLongParts) {
        const subnames = subname.split('.');
        subname = subnames
            .map((s) => {
                return s.length > LONG_NAMES_TRUNCATE_LENGTH
                    ? `${s.slice(0, CHARACTERS_TO_SHOW)}...${s.slice(-CHARACTERS_TO_SHOW)}`
                    : s;
            })
            .join('.');

        formattedName =
            formattedName.length > LONG_NAMES_TRUNCATE_LENGTH
                ? `${formattedName.slice(0, CHARACTERS_TO_SHOW)}...${formattedName.slice(-CHARACTERS_TO_SHOW)}`
                : formattedName;
    }

    return subname ? `${subname}@${formattedName}` : `@${formattedName}`;
}
