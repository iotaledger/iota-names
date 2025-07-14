// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export function splitNameParts(nftName: string) {
    const parts = normalizeNameInput(nftName).split('.');
    const lastIndex = parts.length - 1;
    const parentName = parts[lastIndex];

    return {
        parentName,
        subname: parts.slice(0, lastIndex).join('.'),
    };
}

export function normalizeNameInput(name: string) {
    return name.toLowerCase().replace(/\.iota$/i, '');
}

export function addNameSuffix(name: string) {
    return name.endsWith('.iota') ? name : `${name}.iota`;
}

const LONG_NAMES_TRUNCATE_LENGTH = 11;
interface FormatNameOptions {
    onlyFirstSubname?: boolean;
    truncateLongSubnames?: boolean;
}
export function getNameLabel(
    name: string,
    { onlyFirstSubname = false, truncateLongSubnames = false }: FormatNameOptions = {},
) {
    const { parentName, subname: subnamePart } = splitNameParts(name);

    const subnamesArr = subnamePart.split('.');
    let subname = onlyFirstSubname
        ? `${subnamesArr[0]}${subnamesArr.length > 1 ? '...' : ''}`
        : subnamePart;

    if (truncateLongSubnames) {
        const subnames = subname.split('.');
        subname = subnames
            .map((s) => {
                return s.length > LONG_NAMES_TRUNCATE_LENGTH
                    ? `${s.slice(0, 3)}...${s.slice(-3)}`
                    : s;
            })
            .join('.');
    }

    return subname ? `${subname}@${parentName}` : `@${parentName}`;
}
