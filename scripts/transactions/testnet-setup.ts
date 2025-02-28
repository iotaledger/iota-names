// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@iota/iota-sdk/transactions';

import { mainPackage, MIST_PER_USDC, PackageInfo } from '../config/constants';
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
			prices: [50 * Number(MIST_PER_USDC), 10 * Number(MIST_PER_USDC), 1 * Number(MIST_PER_USDC)],
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
			prices: [15 * Number(MIST_PER_USDC), 5 * Number(MIST_PER_USDC), 0.5 * Number(MIST_PER_USDC)],
		}),
		type: `${config.packageIdPricing}::pricing_config::RenewalConfig`,
	});
};

const publishSetup = async () => {
	const config = mainPackage['testnet'];
	const tx = new Transaction();

	setupIotaNames(tx, config);

	console.log(await signAndExecute(tx, 'testnet'));
};

publishSetup();
