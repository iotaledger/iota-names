// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export function stripParentName(_name: string) {
    const name = normalizeNameInput(_name);
    const parts = name.split('.');
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
