// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@iota/iota-sdk/transactions';
import { NANOS_PER_IOTA } from '@iota/iota-sdk/utils';

import {
	addConfig,
	addCoreConfig,
	authorize,
	newPaymentsConfig,
	newPriceConfig,
	newRenewalConfig,
} from '../init/authorization';
import { readPackageInfo } from '../package-info/constants';
import { prepareMultisigTx } from '../utils/utils';

// Upgrade IOTA-Names
const setupIotaNames = (txb: Transaction) => {
	const packageInfo = readPackageInfo('mainnet');

	// Add new core config
	addConfig({
		txb,
		adminCap: packageInfo.adminCap,
		iotaNames: packageInfo.iotaNames,
		iotaNamesPackageId: packageInfo.packageId,
		config: addCoreConfig({ txb, latestPackageId: packageInfo.packageId }),
		type: `${packageInfo.packageId}::core_config::CoreConfig`,
	});

	// Add new price configs
	addConfig({
		txb,
		adminCap: packageInfo.adminCap,
		iotaNames: packageInfo.iotaNames,
		iotaNamesPackageId: packageInfo.packageId,
		config: newPriceConfig({
			txb,
			packageId: packageInfo.packageId,
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
		type: `${packageInfo.packageId}::pricing_config::PricingConfig`,
	});
	addConfig({
		txb,
		adminCap: packageInfo.adminCap,
		iotaNames: packageInfo.iotaNames,
		iotaNamesPackageId: packageInfo.packageId,
		config: newRenewalConfig({
			txb,
			packageId: packageInfo.packageId,
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
		type: `${packageInfo.packageId}::pricing_config::RenewalConfig`,
	});

	authorize({
		txb,
		adminCap: packageInfo.adminCap,
		iotaNames: packageInfo.iotaNames,
		type: `${packageInfo.packageId}::controller::Controller`,
		iotaNamesPackageId: packageInfo.packageId,
	});

	// authorize and add payments configs
	authorize({
		txb,
		adminCap: packageInfo.adminCap,
		iotaNames: packageInfo.iotaNames,
		type: `${packageInfo.paymentsPackageId}::payments::PaymentsAuth`,
		iotaNamesPackageId: packageInfo.packageId,
	});
	const paymentsConfig = newPaymentsConfig({
		txb,
		packageId: packageInfo.paymentsPackageId,
		coinType: [packageInfo.coins.IOTA],
		baseCurrencyType: packageInfo.coins.IOTA.type,
	});
	addConfig({
		txb,
		adminCap: packageInfo.adminCap,
		iotaNames: packageInfo.iotaNames,
		iotaNamesPackageId: packageInfo.packageId,
		config: paymentsConfig,
		type: `${packageInfo.paymentsPackageId}::payments::PaymentsConfig`,
	});
};

const deauthorize = (txb: Transaction) => {};

const deauthorizePackages = async () => {
	const packageInfo = readPackageInfo('mainnet');
	const tx = new Transaction();

	// Setup iotaNames
	deauthorize(tx);

	// Prepare multisig tx
	await prepareMultisigTx(tx, 'mainnet', packageInfo.adminAddress);
};

const publishSetup = async () => {
	const packageInfo = readPackageInfo('mainnet');
	const tx = new Transaction();

	// Setup iotaNames
	setupIotaNames(tx);

	// Prepare multisig tx
	await prepareMultisigTx(tx, 'mainnet', packageInfo.adminAddress);
};

publishSetup();
deauthorizePackages();
