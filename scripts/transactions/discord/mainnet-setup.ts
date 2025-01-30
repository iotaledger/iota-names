// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@iota/iota-sdk/transactions';

import { mainPackage } from '../../config/constants';
import { authorizeApp } from '../../init/authorization';
import { Packages } from '../../init/packages';
import { prepareMultisigTx } from '../../utils/utils';
import { authorizeDiscordApp } from './discord';

export const prepareMainnetSetupPTB = async () => {
	const txb = new Transaction();
	const config = mainPackage.mainnet;

	Packages('mainnet').Coupons.setupFunction({
		txb,
		packageId: config.coupons.packageId,
		adminCap: config.adminCap,
		iotans: config.iotans,
	});

	authorizeApp({
		txb,
		adminCap: config.adminCap,
		iotans: config.iotans,
		type: Packages('mainnet').Coupons.authorizationType(config.coupons.packageId),
		iotansPackageIdV1: config.packageId,
	});

	authorizeDiscordApp(txb, config);

	await prepareMultisigTx(txb, 'mainnet', config.adminAddress);
};

prepareMainnetSetupPTB();
