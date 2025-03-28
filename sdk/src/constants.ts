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
	mainnet: {
		auctionPackageId: '',
		packageId: '0x71af035413ed499710980ed8adb010bbf2cc5cacf4ab37c7710a4bb87eb58ba5',
		packageIdPricing: '0x71af035413ed499710980ed8adb010bbf2cc5cacf4ab37c7710a4bb87eb58ba5',
		iotaNames: '0x6e0ddefc0ad98889c04bab9639e512c21766c5e6366f89e696956d9be6952871',
		subNamesPackageId: '0xe177697e191327901637f8d2c5ffbbde8b1aaac27ec1024c4b62d1ebd1cd7430',
		tempSubdomainsProxyPackageId:
			'0xf335dfbcb2020fc996250c0d6fd4655c5e2036b0606cac7408aa163f51340886',
		payments: {
			packageId: '0x863d5f9760f302495398c8e4c6e9784bc17c44b079c826a1813715ef08cbe41a',
		},
		coins: {
			IOTA: {
				type: '0x0000000000000000000000000000000000000000000000000000000000000002::iota::IOTA',
			},
		},
		registryTableId: '0xe64cd9db9f829c6cc405d9790bd71567ae07259855f4fba6f02c84f52298c106',
		reverseRegistryTableId: '0xcafc893c3801416ffa4c262888eaa994e055d717d9b0819db3aef4ce35ab5829',
	},
	testnet: {
		auctionPackageId: '',
		packageId: '0x40eee27b014a872f5c3330dcd5329aa55c7fe0fcc6e70c6498852e2e3727172e',
		packageIdPricing: '0x8a4df604a449ccb9ef2efb9747046b78f78ba60fc8d88df098d0dd47619df5a4',
		iotaNames: '0x300369e8909b9a6464da265b9a5a9ab6fe2158a040e84e808628cde7a07ee5a3',
		subNamesPackageId: '0x3c272bc45f9157b7818ece4f7411bdfa8af46303b071aca4e18c03119c9ff636',
		tempSubdomainsProxyPackageId:
			'0x295a0749dae0e76126757c305f218f929df0656df66a6361f8b6c6480a943f12',
		payments: {
			packageId: '0x9e8b85270cf5e7ec0ae44c745abe000b6dd7d8b54ca2d367e044d8baccefc10c',
		},
		/// Testnet coins will be different here for testing purposes, we can publish our own
		coins: {
			IOTA: {
				type: '0x0000000000000000000000000000000000000000000000000000000000000002::iota::IOTA',
			},
		},
		registryTableId: '0xb120c0d55432630fce61f7854795a3463deb6e3b443cc4ae72e1282073ff56e4',
		reverseRegistryTableId: '0xcafc893c3801416ffa4c262888eaa994e055d717d9b0819db3aef4ce35ab5829',
	},
};
