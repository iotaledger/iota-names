// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import type { Config } from './types.js';

export const MAX_U64 = BigInt('18446744073709551615');

/**
 * Allowed keys for metadata.
 */
export const ALLOWED_METADATA = {
	contentHash: 'content_hash',
	avatar: 'avatar',
};

export const mainPackage: Config = {
	devnet: {
		auctionPackageId: '0xe24e72f0623ea19b4b2ec847e2b208033c6f7938b50e31efe4996aa2f23d4477',
		packageId: '0xa1d2ed2008d31d358cfaf61a89aa7cfaa78ed183dbe683620258e98c59f48b13',
		packageIdPricing: '0xa1d2ed2008d31d358cfaf61a89aa7cfaa78ed183dbe683620258e98c59f48b13',
		iotaNames: '0xbf3563622035af599057c46f4b871e0a9817c7bab759354532402be6d9538ba3',
		subNamesPackageId: '0xeaa8d89e19d6f346f7a515bb3cf63fd9b7b456e77a0073a13103bdfbdd8d1980',
		tempSubdomainsProxyPackageId:
			'0x11e01b25113cf141676d2f0b97068adbd2c98dd15ce1f52bd21c595faf63ec55',
		payments: {
			packageId: '0xb06b8075797480a9bb660c927b666ca0301cdffa622e7c6b9c583bd2b45c781a',
		},
		coins: {
			IOTA: {
				type: '0x0000000000000000000000000000000000000000000000000000000000000002::iota::IOTA',
			},
		},
		registryTableId: '0xd5e98aa3e79cff0cd5146dc4d7dea863eaffcce06703e47473f88214c4746501',
		reverseRegistryTableId: '0xcafc893c3801416ffa4c262888eaa994e055d717d9b0819db3aef4ce35ab5829',
	},
	mainnet: {
		auctionPackageId: '',
		packageId: '',
		packageIdPricing: '',
		iotaNames: '',
		subNamesPackageId: '',
		tempSubdomainsProxyPackageId: '',
		payments: {
			packageId: '',
		},
		coins: {
			IOTA: {
				type: '',
			},
		},
		registryTableId: '',
		reverseRegistryTableId: '',
	},
	testnet: {
		auctionPackageId: '',
		packageId: '',
		packageIdPricing: '',
		iotaNames: '',
		subNamesPackageId: '',
		tempSubdomainsProxyPackageId: '',
		payments: {
			packageId: '',
		},
		/// Testnet coins will be different here for testing purposes, we can publish our own
		coins: {
			IOTA: {
				type: '',
			},
		},
		registryTableId: '',
		reverseRegistryTableId: '',
	},
};
