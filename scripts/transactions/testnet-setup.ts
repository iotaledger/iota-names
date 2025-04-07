// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@iota/iota-sdk/transactions';
import { NANOS_PER_IOTA } from '@iota/iota-sdk/utils';

import { PackageInfo, readPackageInfo } from '../config/constants';
import { addConfig, newPriceConfig, newRenewalConfig, removeConfig } from '../init/authorization';
import { signAndExecute } from '../utils/utils';

const setupIotaNames = (txb: Transaction, config: PackageInfo) => {
	removeConfig({
		txb,
		adminCap: config.adminCap,
		iotaNames: config.iotaNames,
		type: `${config.packageIdPricing}::pricing_config::PricingConfig`,
		iotaNamesPackageId: config.packageId,
	});

	removeConfig({
		txb,
		adminCap: config.adminCap,
		iotaNames: config.iotaNames,
		type: `${config.packageIdPricing}::pricing_config::RenewalConfig`,
		iotaNamesPackageId: config.packageId,
	});

	// Add new price configs
	addConfig({
		txb,
		adminCap: config.adminCap,
		iotaNames: config.iotaNames,
		iotaNamesPackageId: config.packageId,
		config: newPriceConfig({
			txb,
			packageId: config.packageId,
			ranges: [
				[3, 3],
				[4, 4],
				[5, 63],
			],
			prices: [
				50 * Number(NANOS_PER_IOTA),
				10 * Number(NANOS_PER_IOTA),
				1 * Number(NANOS_PER_IOTA),
			],
		}),
		type: `${config.packageIdPricing}::pricing_config::PricingConfig`,
	});
	addConfig({
		txb,
		adminCap: config.adminCap,
		iotaNames: config.iotaNames,
		iotaNamesPackageId: config.packageId,
		config: newRenewalConfig({
			txb,
			packageId: config.packageId,
			ranges: [
				[3, 3],
				[4, 4],
				[5, 63],
			],
			prices: [
				15 * Number(NANOS_PER_IOTA),
				5 * Number(NANOS_PER_IOTA),
				0.5 * Number(NANOS_PER_IOTA),
			],
		}),
		type: `${config.packageIdPricing}::pricing_config::RenewalConfig`,
	});
};

const publishSetup = async () => {
	const config = readPackageInfo('testnet');
	const tx = new Transaction();

	setupIotaNames(tx, config);

	console.log(await signAndExecute(tx, 'testnet'));
};

publishSetup();
