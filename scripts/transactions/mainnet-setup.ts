// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@iota/iota-sdk/transactions';
import { NANOS_PER_IOTA } from '@iota/iota-sdk/utils';

import { readPackageInfo } from '../config/constants';
import {
	addConfig,
	addCoreConfig,
	authorizeApp,
	newPaymentsConfig,
	newPriceConfig,
	newRenewalConfig,
} from '../init/authorization';
import { prepareMultisigTx } from '../utils/utils';

// Upgrade IOTA-Names
const setupIotaNames = (txb: Transaction) => {
	const config = readPackageInfo('mainnet');

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
				500 * Number(NANOS_PER_IOTA),
				100 * Number(NANOS_PER_IOTA),
				10 * Number(NANOS_PER_IOTA),
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
				150 * Number(NANOS_PER_IOTA),
				50 * Number(NANOS_PER_IOTA),
				5 * Number(NANOS_PER_IOTA),
			],
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
		type: `${config.paymentsPackageId}::payments::PaymentsApp`,
		iotaNamesPackageId: config.packageId,
	});
	const paymentsconfig = newPaymentsConfig({
		txb,
		packageId: config.paymentsPackageId,
		coinType: [config.coins.IOTA],
		baseCurrencyType: config.coins.IOTA.type,
	});
	addConfig({
		txb,
		adminCap: config.adminCap,
		iotaNames: config.iotaNames,
		iotaNamesPackageId: config.packageId,
		config: paymentsconfig,
		type: `${config.paymentsPackageId}::payments::PaymentsConfig`,
	});
};

const deauthorize = (txb: Transaction) => {};

const deauthorizePackages = async () => {
	const config = readPackageInfo('mainnet');
	const tx = new Transaction();

	// Setup iotaNames
	deauthorize(tx);

	// Prepare multisig tx
	await prepareMultisigTx(tx, 'mainnet', config.adminAddress);
};

const publishSetup = async () => {
	const config = readPackageInfo('mainnet');
	const tx = new Transaction();

	// Setup iotaNames
	setupIotaNames(tx);

	// Prepare multisig tx
	await prepareMultisigTx(tx, 'mainnet', config.adminAddress);
};

publishSetup();
deauthorizePackages();
