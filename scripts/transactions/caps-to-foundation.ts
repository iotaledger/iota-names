// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@iota/iota-sdk/transactions';

import { readPackageInfo } from '../config/constants';
import { prepareMultisigTx } from '../utils/utils';

const config = readPackageInfo('mainnet');

// The new multisig address to transfer the caps to.
const NEW_MULTISIG_ADDR = '0x9b388a6da9dd4f73e0b13abc6100f1141782ef105f6f5e9d986fb6e00f0b2591';

const UPGRADE_CAPS_TO_TRANSFER = [
	// subdomains proxy
	'0x2418376bf13706188d300f077b2378e1b3853490dd1b2007e0b736cc22f5115a',
	// denylist
	'0x72a3c603d0218ab59ae81363e608d6c3c0c344890df40bd6ca7de575f28feb7d',
	// registration
	'0x779ed3df4bdfa55948580f1688ab1fede83f09d6d38fedb2a87b90d5c5179e58',
	// utils (direct_setup), extended with subnames.
	'0x929162c097e47cffabb57e8c1cf334ff44a84b963f0bbaacfbaf792d79993866',
	// IOTA-Names (!! core package)
	'0x9cda28244a0d0de294d2b271e772a9c33eb47d316c59913d7369b545b4af098c',
	// subnames
	'0xc70ac60c1d65da22ed5f30def1a7dfd33ff3a70eb0bf75f12ab559c5f342ea12',
	// AEON
	'0xd5e3b3b8adc2358e031990f3be5c1c8999967666bb3a8ff7c35fd8bc961e06c5',
	// another utils (direct_setup), initial
	'0xe6e24cdf4824e0e14c2cfa97052df2d85ebac61bd8e6ab3d5094c477f4db2eda',
	// renewals
	'0xf7750345cc6c90dc40b1dd93ea761ddfb429761d98ff57d2df3a41a492ba3979',
];

const MISC_PACKAGE_OBJECTS_TO_TRANSFER = [
	// Transfer Policy Cap: AeonNFT
	'0xda9a0354509849dbbdc4aa3fdd6fa855eee92a5107fe971ccfcc42558e32e9fb',
	// Transfer Policy Cap: Subname NFTs
	'0x82535637ee6e59592a8c3e5c9112ee2a2df18fe9544e517be1f85ebdfadfc4ca',
	// Transfer Policy Cap: NS NFTs
	'0x50e63d31137d695e0a42294509d09ba3277a74d634dccf1a703c20a8c1d633f7',

	// Display: Subname NFTs
	'0xaf0cdabb6592026c58dae385d84791f21ce8e35a75f343f7e11acaf224f6a680',
	// Display: NS NFTs
	'0x866fbd8e51b6637c25f0e811ece9a85eb417f3987ecdfefb80f15d1192d72b4c',
	// Display: Aeon
	'0x91086cd554b47838d482521a8a302376120e000abe0c29b227a1371661060074',

	// Publisher: Aeon
	'0x47339900499df62ac40c21d44198331119d5335c7f94777295e5a84f5ae351f7',
	// Publisher: IotaNames
	'0x7339f23f06df3601167d67a31752781d307136fd18304c48c928778e752caae1',
];

const APP_CAPS_TO_TRANSFER = [
	// IOTA-Names Admin Cap (!! core package)
	'0x3f8d702d90c572b60ac692fb5074f7a7ac350b80d9c59eab4f6b7692786cae0a',
];

const profitsToTreasury = (txb: Transaction) => {
	const generalProfits = txb.moveCall({
		target: `${config.packageId}::iota_names::withdraw`,
		arguments: [txb.object(config.adminCap), txb.object(config.iotaNames)],
	});

	txb.transferObjects([generalProfits], txb.pure.address(config.treasuryAddress!));
};

const treasuryClaimAndMoveCapsToFoundation = async () => {
	const txb = new Transaction();

	// transfer profits to treasury
	profitsToTreasury(txb);

	txb.transferObjects(
		[...UPGRADE_CAPS_TO_TRANSFER, ...MISC_PACKAGE_OBJECTS_TO_TRANSFER, ...APP_CAPS_TO_TRANSFER],
		txb.pure.address(NEW_MULTISIG_ADDR),
	);

	await prepareMultisigTx(txb, 'mainnet', config.adminAddress);
};

treasuryClaimAndMoveCapsToFoundation();
