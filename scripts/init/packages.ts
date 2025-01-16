// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { IotaTransactionBlockResponse } from '@iota/iota-sdk/client';
import { Transaction } from '@iota/iota-sdk/transactions';
import { NANOS_PER_IOTA } from '@iota/iota-sdk/utils';

import { Config, mainPackage, MAX_AGE } from '../config/constants';
import {
	addConfig,
	addRegistry,
	newLookupRegistry,
	newPaymentsConfig,
	newPriceConfig,
	newRenewalConfig,
	setupApp,
} from './authorization';
import { createDisplay } from './display_tp';

export type Network = 'mainnet' | 'testnet' | 'devnet' | 'localnet';

const parseCorePackageObjects = (data: IotaTransactionBlockResponse) => {
	const packageId = data.objectChanges!.find((x) => x.type === 'published');
	if (!packageId || packageId.type !== 'published') throw new Error('Expected Published object');
	const upgradeCap = parseCreatedObject(data, '0x2::package::UpgradeCap');

	return {
		packageId: packageId.packageId,
		upgradeCap: upgradeCap,
	};
};

const parseCreatedObject = (data: IotaTransactionBlockResponse, objectType: string) => {
	const obj = data.objectChanges!.find((x) => x.type === 'created' && x.objectType === objectType);
	if (!obj || obj.type !== 'created') throw new Error(`Expected ${objectType} object`);

	return obj.objectId;
};

const parseMutatedObject = (data: IotaTransactionBlockResponse, objectType: string) => {
	const obj = data.objectChanges!.find((x) => x.type === 'mutated' && x.objectType === objectType);
	if (!obj || obj.type !== 'mutated') throw new Error(`Expected ${objectType} object`);

	return obj.objectId;
};

export const Packages = (network: Network) => {
	return {
		IotaNames: {
			order: 1,
			folder: 'iota-names',
			processPublish: (data: IotaTransactionBlockResponse) => {
				const { packageId, upgradeCap } = parseCorePackageObjects(data);
				const publisher = parseCreatedObject(data, '0x2::package::Publisher');
				const iotaNames = parseCreatedObject(data, `${packageId}::iota_names::IotaNames`);
				const adminCap = parseCreatedObject(data, `${packageId}::iota_names::AdminCap`);

				return {
					packageId,
					upgradeCap,
					publisher,
					iotaNames,
					adminCap,
				};
			},
			setupFunction: (
				txb: Transaction,
				packageId: string,
				adminCap: string,
				iotaNames: string,
				publisher: string,
			) => {
				// Adds the default registry where name records and reverse records will live
				addRegistry({
					txb,
					adminCap,
					iotaNames,
					iotaNamesPackageId: packageId,
					registry: newLookupRegistry({ txb, iotaNamesPackageId: packageId, adminCap: adminCap }),
					type: `${packageId}::registry::Registry`,
				});
				// Adds the configuration file (pricelist and public key)
				addConfig({
					txb,
					adminCap,
					iotaNames,
					iotaNamesPackageId: packageId,
					config: newPriceConfig({
						txb,
						packageId,
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
					type: `${packageId}::pricing_config::PricingConfig`,
				});
				addConfig({
					txb,
					adminCap,
					iotaNames,
					iotaNamesPackageId: packageId,
					config: newRenewalConfig({
						txb,
						packageId,
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
					type: `${packageId}::pricing_config::RenewalConfig`,
				});
				// create display for names
				createDisplay({
					txb,
					publisher,
					isSubdomain: false,
					iotaNamesPackageId: packageId,
					network: 'testnet',
					subdomainsPackageId: packageId,
				});
				// create display for subnames
				createDisplay({
					txb,
					publisher,
					isSubdomain: true,
					iotaNamesPackageId: packageId,
					network: 'testnet',
					subdomainsPackageId: packageId,
				});
			},
			authorizationType: (packageId: string) => `${packageId}::controller::Controller`, // Authorize the iotaNames controller
		},
		DenyList: {
			order: 2,
			folder: 'denylist',
			processPublish: (data: IotaTransactionBlockResponse) => {
				const { packageId, upgradeCap } = parseCorePackageObjects(data);

				return {
					packageId,
					upgradeCap,
				};
			},
			authorizationType: (packageId: string) => `${packageId}::denylist::DenyListAuth`,
			setupFunction: (txb: Transaction, packageId: string, adminCap: string, iotaNames: string) => {
				setupApp({ txb, adminCap, iotaNames, target: `${packageId}::denylist` });
			},
		},
		Payments: {
			order: 2,
			folder: 'payments',
			processPublish: (data: IotaTransactionBlockResponse) => {
				const { packageId, upgradeCap } = parseCorePackageObjects(data);

				return {
					packageId,
					upgradeCap,
				};
			},
			authorizationType: (packageId: string) => `${packageId}::payments::PaymentsApp`,
			setupFunction: ({
				txb,
				packageId,
				adminCap,
				iotaNames,
				iotaNamesPackageId,
			}: {
				txb: Transaction;
				packageId: string;
				adminCap: string;
				iotaNames: string;
				iotaNamesPackageId: string;
			}) => {
				const config = mainPackage[network as keyof Config];
				const paymentsconfig = newPaymentsConfig({
					txb,
					packageId,
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
					adminCap,
					iotaNames,
					iotaNamesPackageId,
					config: paymentsconfig,
					type: `${packageId}::payments::PaymentsConfig`,
				});
			},
		},
		Subdomains: {
			order: 3,
			folder: 'subdomains',
			processPublish: (data: IotaTransactionBlockResponse) => {
				const { packageId, upgradeCap } = parseCorePackageObjects(data);

				return {
					packageId,
					upgradeCap,
				};
			},
			setupFunction: (
				txb: Transaction,
				packageId: string,
				adminCap: string,
				iotaNames: string,
				iotaNamesPackageId: string,
			) => {
				addConfig({
					txb,
					adminCap,
					iotaNames,
					iotaNamesPackageId,
					config: txb.moveCall({
						target: `${packageId}::config::default`,
					}),
					type: `${packageId}::config::SubDomainConfig`,
				});
			},
			authorizationType: (packageId: string) => `${packageId}::subdomains::SubDomains`,
		},
		TempSubdomainProxy: {
			order: 3,
			folder: 'temp-subdomain-proxy',
			processPublish: (data: IotaTransactionBlockResponse) => {
				const { packageId, upgradeCap } = parseCorePackageObjects(data);
				return {
					packageId,
					upgradeCap,
				};
			},
		},
	};
};
