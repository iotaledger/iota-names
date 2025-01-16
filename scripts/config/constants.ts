// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { normalizeIotaAddress } from '@iota/iota-sdk/utils';

export type Network = 'mainnet' | 'testnet';

export type Config = Record<'mainnet' | 'testnet', PackageInfo>;

export type PackageInfo = {
	packageId: string;
	packageIdPricing: string;
	upgradeCap?: string;
	publisherId: string;
	adminAddress: string;
	adminCap: string;
	iotaNames: string;
	displayObject?: string;
	subNamesPackageId: string;
	tempSubdomainsProxyPackageId: string;
	treasuryAddress?: string;
	coins: {
		[key: string]: {
			type: string;
			metadataId: string;
			feed: string;
		};
	};
	registryTableId: string;
};

export const mainPackage: Config = {
	mainnet: {
		packageId: '0x71af035413ed499710980ed8adb010bbf2cc5cacf4ab37c7710a4bb87eb58ba5',
		packageIdPricing: '0x71af035413ed499710980ed8adb010bbf2cc5cacf4ab37c7710a4bb87eb58ba5',
		upgradeCap: '0x9cda28244a0d0de294d2b271e772a9c33eb47d316c59913d7369b545b4af098c',
		publisherId: '0x7339f23f06df3601167d67a31752781d307136fd18304c48c928778e752caae1',
		adminAddress: normalizeIotaAddress(
			'0xa81a2328b7bbf70ab196d6aca400b5b0721dec7615bf272d95e0b0df04517e72',
		),
		adminCap: '0x3f8d702d90c572b60ac692fb5074f7a7ac350b80d9c59eab4f6b7692786cae0a',
		iotaNames: '0x6e0ddefc0ad98889c04bab9639e512c21766c5e6366f89e696956d9be6952871',
		displayObject: '0x866fbd8e51b6637c25f0e811ece9a85eb417f3987ecdfefb80f15d1192d72b4c',
		subNamesPackageId: '0xe177697e191327901637f8d2c5ffbbde8b1aaac27ec1024c4b62d1ebd1cd7430',
		tempSubdomainsProxyPackageId:
			'0xf335dfbcb2020fc996250c0d6fd4655c5e2036b0606cac7408aa163f51340886',
		treasuryAddress: '0x638791b625c4482bc1b917847cdf8aa76fe226c0f3e0a9b1aa595625989e98a1',
		coins: {
			IOTA: {
				type: '0x0000000000000000000000000000000000000000000000000000000000000002::iota::IOTA',
				metadataId: '0x9258181f5ceac8dbffb7030890243caed69a9599d2886d957a9cb7656af3bdb3',
				feed: '0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744',
			},
		},
		registryTableId: '0xe64cd9db9f829c6cc405d9790bd71567ae07259855f4fba6f02c84f52298c106',
	},
	testnet: {
		packageId: '0x40eee27b014a872f5c3330dcd5329aa55c7fe0fcc6e70c6498852e2e3727172e',
		packageIdPricing: '0x8a4df604a449ccb9ef2efb9747046b78f78ba60fc8d88df098d0dd47619df5a4',
		publisherId: '0xfe09cf0b3d77678b99250572624bf74fe3b12af915c5db95f0ed5d755612eb68',
		adminAddress: '0xfe09cf0b3d77678b99250572624bf74fe3b12af915c5db95f0ed5d755612eb68',
		adminCap: normalizeIotaAddress(
			'0x5def5bd9dc94b7d418d081a91c533ec619fb4350e6c4e4602aea96fd49331b15',
		),
		iotaNames: '0x300369e8909b9a6464da265b9a5a9ab6fe2158a040e84e808628cde7a07ee5a3',
		subNamesPackageId: '0x3c272bc45f9157b7818ece4f7411bdfa8af46303b071aca4e18c03119c9ff636',
		tempSubdomainsProxyPackageId:
			'0x295a0749dae0e76126757c305f218f929df0656df66a6361f8b6c6480a943f12',
		/// Testnet coins will be different here for testing purposes, we can publish our own
		coins: {
			IOTA: {
				type: '0x0000000000000000000000000000000000000000000000000000000000000002::iota::IOTA',
				metadataId: '0x587c29de216efd4219573e08a1f6964d4fa7cb714518c2c8a0f29abfa264327d',
				feed: '0x50c67b3fd225db8912a424dd4baed60ffdde625ed2feaaf283724f9608fea266',
			},
		},
		registryTableId: '0xb120c0d55432630fce61f7854795a3463deb6e3b443cc4ae72e1282073ff56e4',
	},
};
export const MAX_AGE = 60; // In seconds, 60 seconds as max age for last price, can be updated
