// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { Transaction } from '@iota/iota-sdk/transactions';

import { getClient, signAndExecute } from '../utils/utils';
import { authorizeApp } from './authorization';
import { Network, Packages } from './packages';
import { queryRegistryTable } from './queries';
import { PackageInfo } from './types';

export const setup = async (packageInfo: PackageInfo, network: Network) => {
	const packages = Packages(network);

	const txb = new Transaction();

	for (const [key, pkg] of Object.entries(packageInfo)) {
		const data = packages[key as keyof typeof packages];
		if (data && 'authorizationType' in data) {
			authorizeApp({
				txb,
				adminCap: packageInfo.IotaNames.adminCap,
				iotaNames: packageInfo.IotaNames.iotaNames,
				type: data.authorizationType(pkg.packageId),
				iotaNamesPackageId: packageInfo.IotaNames.packageId,
			});
		}
	}
	// Call setup functions for our packages.
	packages.Subdomains.setupFunction(
		txb,
		packageInfo.Subdomains.packageId,
		packageInfo.IotaNames.adminCap,
		packageInfo.IotaNames.iotaNames,
		packageInfo.IotaNames.packageId,
	);
	packages.DenyList.setupFunction(
		txb,
		packageInfo.DenyList.packageId,
		packageInfo.IotaNames.adminCap,
		packageInfo.IotaNames.iotaNames,
	);
	packages.IotaNames.setupFunction(
		txb,
		packageInfo.IotaNames.packageId,
		packageInfo.IotaNames.adminCap,
		packageInfo.IotaNames.iotaNames,
		packageInfo.IotaNames.publisher,
	);
	packages.Payments.setupFunction({
		txb,
		packageId: packageInfo.Payments.packageId,
		adminCap: packageInfo.IotaNames.adminCap,
		iotaNames: packageInfo.IotaNames.iotaNames,
		iotaNamesPackageId: packageInfo.IotaNames.packageId,
	});
	let retries = 0;

	try {
		txb.setGasBudget(1_000_000_000);

		while (retries < 3) {
			console.log('Retrying setup...');
			const res = await signAndExecute(txb, network);

			await getClient(network).waitForTransaction({
				digest: res.digest,
			});

			if (res.effects?.status.status === 'success') break;
			console.log(res);
			retries++;

			if (retries === 3) {
				console.error('Failed to set up packages');
				return;
			}
		}

		console.log('******* Packages set up successfully *******');

		try {
			// correct the sdk constants to also include the registryTableID
			const constants = JSON.parse(
				readFileSync(path.resolve(__dirname, '../constants.sdk.json'), 'utf8'),
			);

			console.log(constants);

			// delay 3 seconds
			await new Promise((resolve) => setTimeout(resolve, 3000));

			constants.registryTableId = await queryRegistryTable(
				getClient(network),
				packageInfo.IotaNames.iotaNames,
				packageInfo.IotaNames.packageId,
			);

			writeFileSync(
				path.resolve(path.resolve(__dirname, '../'), 'constants.sdk.json'),
				JSON.stringify(constants),
			);
		} catch (e) {
			console.error(
				'Error while updating sdk constants: Most likely the file does not exist if you run `setup` without publishing through this',
			);
			console.error(e);
		}
	} catch (e) {
		console.error('Something went wrong!');
		console.dir(e, { depth: null });
	}
};
