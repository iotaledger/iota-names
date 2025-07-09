// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export function splitNameInParts(name: string) {
    const parts = name.split('.');

    return {
        namePart: parts.slice(-2).join('.'),
        subnamePart: parts.slice(0, -2).join('.'),
    };
}

export function normalizeNameInput(name: string) {
    return name.toLowerCase().replace(/\.iota$/i, '');
}
