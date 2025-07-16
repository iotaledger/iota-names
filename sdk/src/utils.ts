// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

const LABEL_REGEX = /(?!-)[a-z0-9-]{0,62}[a-z0-9]/;
const PATH_REGEX = new RegExp(`(?:${LABEL_REGEX.source}(?:\\.${LABEL_REGEX.source})*)`);
const NAME_AT_REGEX = new RegExp(`^(${PATH_REGEX.source})?@${LABEL_REGEX.source}$`);
const NAME_DOT_REGEX = new RegExp(`^(?:${LABEL_REGEX.source}\\.)+(iota)$`);
const MAX_LENGTH = 235;

export function isValidIotaName(name: string): boolean {
    if (name.length > MAX_LENGTH) {
        return false;
    }

    return NAME_AT_REGEX.test(name) || NAME_DOT_REGEX.test(name);
}

export function normalizeIotaName(name: string, format: 'at' | 'dot' = 'at'): string {
    const lowerCase = name.toLowerCase();
    let parts;

    if (NAME_AT_REGEX.test(lowerCase)) {
        let [path, name] = lowerCase.split('@');
        parts = [...(path ? path.split('.') : []), name];
    } else if (NAME_DOT_REGEX.test(lowerCase)) {
        parts = lowerCase.split('.').slice(0, -1);
    } else {
        throw new Error(`Invalid IOTA name "${name}"`);
    }

    if (format === 'dot') {
        return `${parts.join('.')}.iota`;
    } else {
        return `${parts.slice(0, -1).join('.')}@${parts[parts.length - 1]}`;
    }
}

export function validateIotaName(
    name: string,
    minLength: number = 3,
    maxLength: number = 64,
): string | null {
    if (!name) return null;

    if (name.includes('.')) {
        return 'No subnames allowed';
    }
    if (!LABEL_REGEX.test(name)) {
        return 'Invalid characters. Only a-z, 0-9, and hyphens (not at the beginning or end) are allowed';
    }
    if (name.length < minLength || name.length > maxLength) {
        return `Name must be ${minLength}-${maxLength} characters long`;
    }
    return null;
}
