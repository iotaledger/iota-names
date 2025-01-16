// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@iota/iota-sdk/transactions';

import { mainPackage, MAX_AGE, MIST_PER_USDC } from '../config/constants';
import {
	addConfig,
	addCoreConfig,
	authorizeApp,
	deauthorizeApp,
	newPaymentsConfig,
	newPriceConfig,
	newRenewalConfig,
	removeConfig,
} from '../init/authorization';
import { prepareMultisigTx } from '../utils/utils';

// Upgrade iotaNames
const setupiotaNames = (txb: Transaction) => {
	const config = mainPackage['mainnet'];

	// Add new core config
	addConfig({
		txb,
		adminCap: config.adminCap,
		iotaNames: config.iotaNames,
		iotaNamesPackageId: config.packageId,
		config: addCoreConfig({ txb, latestPackageId: config.packageId }),
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
				500 * Number(MIST_PER_USDC),
				100 * Number(MIST_PER_USDC),
				10 * Number(MIST_PER_USDC),
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
			prices: [150 * Number(MIST_PER_USDC), 50 * Number(MIST_PER_USDC), 5 * Number(MIST_PER_USDC)],
		}),
		type: `${config.packageIdPricing}::pricing_config::RenewalConfig`,
	});

	authorizeApp({
		txb,
		adminCap: config.adminCap,
		iotaNames: config.iotaNames,
		type: `${config.packageIdPricing}::controller::Controller`,
		iotaNamesPackageId: config.packageId,
	});

	// authorize and add payments configs
	authorizeApp({
		txb,
		adminCap: config.adminCap,
		iotaNames: config.iotaNames,
		type: `${config.payments.packageId}::payments::PaymentsApp`,
		iotaNamesPackageId: config.packageId,
	});
	const paymentsconfig = newPaymentsConfig({
		txb,
		packageId: config.payments.packageId,
		coinTypeAndDiscount: [
			[config.coins.USDC, 0],
			[config.coins.IOTA, 0],
			[config.coins.NS, 25],
		],
		baseCurrencyType: config.coins.USDC.type,
		maxAge: MAX_AGE,
	});
	addConfig({
		txb,
		adminCap: config.adminCap,
		iotaNames: config.iotaNames,
		iotaNamesPackageId: config.packageId,
		config: paymentsconfig,
		type: `${config.payments.packageId}::payments::PaymentsConfig`,
	});
};

const deauthorize = (txb: Transaction) => {

};

const deauthorizePackages = async () => {
	const config = mainPackage['mainnet'];
	const tx = new Transaction();

	// Setup iotaNames
	deauthorize(tx);

	// Prepare multisig tx
	await prepareMultisigTx(tx, 'mainnet', config.adminAddress);
};

const publishSetup = async () => {
	const config = mainPackage['mainnet'];
	const tx = new Transaction();

	// Setup iotaNames
	setupiotaNames(tx);

	// Prepare multisig tx
	await prepareMultisigTx(tx, 'mainnet', config.adminAddress);
};

// publishSetup();
deauthorizePackages();
