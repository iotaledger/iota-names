// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

const IOTA_NAME_REGEX =
	/^(?!.*(^(?!@)|[-.@])($|[-.@]))(?:[a-z0-9-]{0,63}(?:\.[a-z0-9-]{0,63})*)?@[a-z0-9-]{0,63}$/i;
const IOTA_NAMES_DOMAIN_REGEX = /^(?!.*(^|[-.])($|[-.]))(?:[a-z0-9-]{0,63}\.)+iota$/i;
const MAX_IOTA_NAME_LENGTH = 235;

export function isValidIotaName(name: string): boolean {
	if (name.length > MAX_IOTA_NAME_LENGTH) {
		return false;
	}

	if (name.includes('@')) {
		return IOTA_NAME_REGEX.test(name);
	}

	return IOTA_NAMES_DOMAIN_REGEX.test(name);
}

export function normalizeIotaName(name: string, format: 'at' | 'dot' = 'at'): string {
	const lowerCase = name.toLowerCase();
	let parts;

	if (lowerCase.includes('@')) {
		if (!IOTA_NAME_REGEX.test(lowerCase)) {
			throw new Error(`Invalid IOTA name ${name}`);
		}
		const [labels, domain] = lowerCase.split('@');
		parts = [...(labels ? labels.split('.') : []), domain];
	} else {
		if (!IOTA_NAMES_DOMAIN_REGEX.test(lowerCase)) {
			throw new Error(`Invalid IOTA name ${name}`);
		}
		parts = lowerCase.split('.').slice(0, -1);
	}

	if (format === 'dot') {
		return `${parts.join('.')}.iota`;
	}

	return `${parts.slice(0, -1).join('.')}@${parts[parts.length - 1]}`;
}
