// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

const LABEL_REGEX = /(?!-)[a-z0-9-]{0,62}[a-z0-9]/;
const PATH_REGEX = new RegExp(`(?:${LABEL_REGEX.source}(?:\\.${LABEL_REGEX.source})*)`);
const NAME_REGEX = new RegExp(`^${PATH_REGEX.source}@${LABEL_REGEX.source}$`);
const DOMAIN_REGEX = new RegExp(`^(?:${LABEL_REGEX.source}\\.)+(iota)$`);
const MAX_LENGTH = 235;

export function isValidIotaName(name: string): boolean {
	if (name.length > MAX_LENGTH) {
		return false;
	}

	return NAME_REGEX.test(name) || DOMAIN_REGEX.test(name);
}

export function normalizeIotaName(name: string, format: 'at' | 'dot' = 'at'): string {
	const lowerCase = name.toLowerCase();
	let parts;

	if (NAME_REGEX.test(lowerCase)) {
		let [path, domain] = lowerCase.split('@');
		parts = [...path.split('.'), domain];
	} else if (DOMAIN_REGEX.test(lowerCase)) {
		parts = lowerCase.split('.');
	} else {
		throw new Error(`Invalid IOTA name "${name}"`);
	}

	if (format === 'dot') {
		return parts.join('.');
	} else {
		return `${parts.slice(0, -1).join('.')}@${parts[parts.length - 1]}`;
	}
}
