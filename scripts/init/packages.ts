// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { IotaTransactionBlockResponse } from '@iota/iota-sdk/client';
import { Transaction } from '@iota/iota-sdk/transactions';
import { NANOS_PER_IOTA } from '@iota/iota-sdk/utils';

import {
	addConfig,
	addRegistry,
	newLookupRegistry,
	newPriceConfig,
	setupApp,
} from './authorization';
import { createDisplay } from './display_tp';
import { IOTANames, IOTANamesDependentPackages, TempSubdomainProxy } from './manifests';

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

export const Packages = (network: Network) => {
	const rev = network === 'localnet' ? 'main' : `framework/${network}`;
	const subdomainExtraDependencies = `denylist = { local = "../denylist" }`;

	return {
		IOTANames: {
			order: 1,
			folder: 'iota-names',
			manifest: IOTANames(rev),
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
					iotaNamesPackageIdV1: packageId,
					registry: newLookupRegistry({ txb, iotaNamesPackageIdV1: packageId, adminCap: adminCap }),
					type: `${packageId}::registry::Registry`,
				});
				// Adds the configuration file (pricelist and public key)
				addConfig({
					txb,
					adminCap,
					iotaNames,
					iotaNamesPackageIdV1: packageId,
					config: newPriceConfig({
						txb,
						iotaNamesPackageIdV1: packageId,
						priceList: {
							three: 5 * Number(NANOS_PER_IOTA),
							four: 2 * Number(NANOS_PER_IOTA),
							fivePlus: 0.5 * Number(NANOS_PER_IOTA),
						},
					}),
					type: `${packageId}::config::Config`,
				});
				// create display for names
				createDisplay({
					txb,
					publisher,
					isSubdomain: false,
					iotaNamesPackageIdV1: packageId,
					network: 'testnet',
					subdomainsPackageId: packageId,
				});
				// create display for subnames
				createDisplay({
					txb,
					publisher,
					isSubdomain: true,
					iotaNamesPackageIdV1: packageId,
					network: 'testnet',
					subdomainsPackageId: packageId,
				});
			},
		},
		Utils: {
			order: 2,
			folder: 'utils',
			manifest: IOTANamesDependentPackages(rev, 'utils'),
			processPublish: (data: IotaTransactionBlockResponse) => {
				const { packageId, upgradeCap } = parseCorePackageObjects(data);

				return {
					packageId,
					upgradeCap,
				};
			},
			authorizationType: (packageId: string) => `${packageId}::direct_setup::DirectSetup`,
		},
		DenyList: {
			order: 2,
			folder: 'denylist',
			manifest: IOTANamesDependentPackages(rev, 'denylist'),
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
		Registration: {
			order: 2,
			folder: 'registration',
			manifest: IOTANamesDependentPackages(rev, 'registration'),
			processPublish: (data: IotaTransactionBlockResponse) => {
				const { packageId, upgradeCap } = parseCorePackageObjects(data);

				return {
					packageId,
					upgradeCap,
				};
			},
			authorizationType: (packageId: string) => `${packageId}::register::Register`,
		},
		Renewal: {
			order: 2,
			folder: 'renewal',
			manifest: IOTANamesDependentPackages(rev, 'renewal'),
			processPublish: (data: IotaTransactionBlockResponse) => {
				const { packageId, upgradeCap } = parseCorePackageObjects(data);

				return {
					packageId,
					upgradeCap,
				};
			},
			authorizationType: (packageId: string) => `${packageId}::renew::Renew`,
			setupFunction: ({
				txb,
				packageId,
				adminCap,
				iotaNamesPackageIdV1,
				iotaNames,
				priceList,
			}: {
				txb: Transaction;
				packageId: string;
				iotaNamesPackageIdV1: string;
				adminCap: string;
				iotaNames: string;
				priceList: { [key: string]: number };
			}) => {
				const configuration = newPriceConfig({
					txb,
					iotaNamesPackageIdV1,
					priceList,
				});
				setupApp({
					txb,
					adminCap,
					iotaNames: iotaNames,
					target: `${packageId}::renew::setup`,
					args: [configuration],
				});
			},
		},
		Subdomains: {
			order: 3,
			folder: 'subdomains',
			manifest: IOTANamesDependentPackages(rev, 'subdomains', subdomainExtraDependencies),
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
				iotaNamesPackageIdV1: string,
			) => {
				addConfig({
					txb,
					adminCap,
					iotaNames,
					iotaNamesPackageIdV1,
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
			folder: 'temp_subdomain_proxy',
			manifest: TempSubdomainProxy(rev),
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
