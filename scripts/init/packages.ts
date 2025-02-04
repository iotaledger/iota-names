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
import { IOTANS, IOTANSDependentPackages, TempSubdomainProxy } from './manifests';

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
		IOTANS: {
			order: 1,
			folder: 'iotans',
			manifest: IOTANS(rev),
			processPublish: (data: IotaTransactionBlockResponse) => {
				const { packageId, upgradeCap } = parseCorePackageObjects(data);
				const publisher = parseCreatedObject(data, '0x2::package::Publisher');
				const iotans = parseCreatedObject(data, `${packageId}::iotans::IotaNS`);
				const adminCap = parseCreatedObject(data, `${packageId}::iotans::AdminCap`);

				return {
					packageId,
					upgradeCap,
					publisher,
					iotans,
					adminCap,
				};
			},
			setupFunction: (
				txb: Transaction,
				packageId: string,
				adminCap: string,
				iotans: string,
				publisher: string,
			) => {
				// Adds the default registry where name records and reverse records will live
				addRegistry({
					txb,
					adminCap,
					iotans,
					iotansPackageIdV1: packageId,
					registry: newLookupRegistry({ txb, iotansPackageIdV1: packageId, adminCap: adminCap }),
					type: `${packageId}::registry::Registry`,
				});
				// Adds the configuration file (pricelist and public key)
				addConfig({
					txb,
					adminCap,
					iotans,
					iotansPackageIdV1: packageId,
					config: newPriceConfig({
						txb,
						iotansPackageIdV1: packageId,
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
					iotansPackageIdV1: packageId,
					network: 'testnet',
					subdomainsPackageId: packageId,
				});
				// create display for subnames
				createDisplay({
					txb,
					publisher,
					isSubdomain: true,
					iotansPackageIdV1: packageId,
					network: 'testnet',
					subdomainsPackageId: packageId,
				});
			},
		},
		Utils: {
			order: 2,
			folder: 'utils',
			manifest: IOTANSDependentPackages(rev, 'utils'),
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
			manifest: IOTANSDependentPackages(rev, 'denylist'),
			processPublish: (data: IotaTransactionBlockResponse) => {
				const { packageId, upgradeCap } = parseCorePackageObjects(data);

				return {
					packageId,
					upgradeCap,
				};
			},
			authorizationType: (packageId: string) => `${packageId}::denylist::DenyListAuth`,
			setupFunction: (txb: Transaction, packageId: string, adminCap: string, iotans: string) => {
				setupApp({ txb, adminCap, iotans, target: `${packageId}::denylist` });
			},
		},
		Registration: {
			order: 2,
			folder: 'registration',
			manifest: IOTANSDependentPackages(rev, 'registration'),
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
			manifest: IOTANSDependentPackages(rev, 'renewal'),
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
				iotansPackageIdV1,
				iotans,
				priceList,
			}: {
				txb: Transaction;
				packageId: string;
				iotansPackageIdV1: string;
				adminCap: string;
				iotans: string;
				priceList: { [key: string]: number };
			}) => {
				const configuration = newPriceConfig({
					txb,
					iotansPackageIdV1,
					priceList,
				});
				setupApp({
					txb,
					adminCap,
					iotans: iotans,
					target: `${packageId}::renew::setup`,
					args: [configuration],
				});
			},
		},
		DayOne: {
			order: 2,
			folder: 'day_one',
			manifest: IOTANSDependentPackages(rev, 'day_one'),
			processPublish: (data: IotaTransactionBlockResponse) => {
				const { packageId, upgradeCap } = parseCorePackageObjects(data);

				return {
					packageId,
					upgradeCap,
				};
			},
			authorizationType: (packageId: string) => `${packageId}::bogo::BogoApp`,
		},
		Coupons: {
			order: 2,
			folder: 'coupons',
			manifest: IOTANSDependentPackages(rev, 'coupons'),
			processPublish: (data: IotaTransactionBlockResponse) => {
				const { packageId, upgradeCap } = parseCorePackageObjects(data);

				return {
					packageId,
					upgradeCap,
				};
			},
			authorizationType: (packageId: string) => `${packageId}::coupon_house::CouponsApp`,
			setupFunction: ({
				txb,
				packageId,
				adminCap,
				iotans,
			}: {
				txb: Transaction;
				packageId: string;
				adminCap: string;
				iotans: string;
			}) => {
				setupApp({ txb, adminCap, iotans, target: `${packageId}::coupon_house` });
			},
		},
		Subdomains: {
			order: 3,
			folder: 'subdomains',
			manifest: IOTANSDependentPackages(rev, 'subdomains', subdomainExtraDependencies),
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
				iotans: string,
				iotansPackageIdV1: string,
			) => {
				addConfig({
					txb,
					adminCap,
					iotans,
					iotansPackageIdV1,
					config: txb.moveCall({
						target: `${packageId}::config::default`,
					}),
					type: `${packageId}::config::SubDomainConfig`,
				});
			},
			authorizationType: (packageId: string) => `${packageId}::subdomains::SubDomains`,
		},
		Discounts: {
			order: 3,
			folder: 'discounts',
			manifest: IOTANSDependentPackages(rev, 'discounts', 'day_one = { local = "../day_one" }'),
			processPublish: (data: IotaTransactionBlockResponse) => {
				const { packageId, upgradeCap } = parseCorePackageObjects(data);
				const discountHouse = parseCreatedObject(data, `${packageId}::house::DiscountHouse`);

				return {
					packageId,
					upgradeCap,
					discountHouse,
				};
			},
			authorizationType: (packageId: string) => `${packageId}::house::DiscountHouseApp`,
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
