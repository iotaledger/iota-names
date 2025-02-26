// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@iota/iota-sdk/transactions';

import { mainPackage } from '../config/constants';
import {
	newCoreConfig,
	authorizeApp,
	newPriceConfig,
	newRenewalConfig,
	addConfig,
} from '../init/authorization';
import { prepareMultisigTx } from '../utils/utils';
import { NANOS_PER_IOTA } from '@iota/iota-sdk/utils';

// Upgrade Suins
const setupSuins = (txb: Transaction) => {
	const config = mainPackage['mainnet'];

	// Add new core config
	addConfig({
		txb,
		adminCap: config.adminCap,
		iotaNames: config.iotaNames,
		iotaNamesPackageId: config.packageId,
		config: newCoreConfig({ txb, packageId: config.packageId }),
		type: `${config.packageId}::core_config::CoreConfig`,
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
				500 * Number(NANOS_PER_IOTA),
				100 * Number(NANOS_PER_IOTA),
				10 * Number(NANOS_PER_IOTA),
			],
		}),
		type: `${config.packageId}::pricing_config::PricingConfig`,
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
			prices: [150 * Number(NANOS_PER_IOTA), 50 * Number(NANOS_PER_IOTA), 5 * Number(NANOS_PER_IOTA)],
		}),
		type: `${config.packageId}::pricing_config::RenewalConfig`,
	});

	authorizeApp({
		txb,
		adminCap: config.adminCap,
		iotaNames: config.iotaNames,
		type: `${config.packageId}::controller::Controller`,
		iotaNamesPackageId: config.packageId,
	});
};

const deauthorize = (txb: Transaction) => {
	
};

const deauthorizePackages = async () => {
	const config = mainPackage['mainnet'];
	const tx = new Transaction();

	// Setup IOTA-Names
	deauthorize(tx);

	// Prepare multisig tx
	await prepareMultisigTx(tx, 'mainnet', config.adminAddress);
};

const publishSetup = async () => {
	const config = mainPackage['mainnet'];
	const tx = new Transaction();

	// Setup IOTA-Names
	setupSuins(tx);

	// Prepare multisig tx
	await prepareMultisigTx(tx, 'mainnet', config.adminAddress);
};

publishSetup();
deauthorizePackages();
