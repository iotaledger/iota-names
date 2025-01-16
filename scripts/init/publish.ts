// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { existsSync, unlinkSync, writeFileSync } from 'fs';
import path from 'path';
import { Transaction } from '@iota/iota-sdk/transactions';

import { getClient, managePackage, publishPackage, signAndExecute } from '../utils/utils';
import { Network, Packages } from './packages';
import { PackageInfo } from './types';

export const publishPackages = async (network: Network, isCiJob = false, configPath?: string) => {
	const packages = Packages(isCiJob ? 'mainnet' : network);
	const contractsPath = path.resolve(__dirname, '../../packages');
	const results: Record<string, Record<string, string>> = {};

	// split by ordering, and publish in batch.
	const orderings = [...new Set([...Object.values(packages).map((x) => x.order)])];

	// We do the publishing in batches, because some needs to be published before others
	for (const ordering of orderings) {
		const list = Object.entries(packages).filter((x) => x[1].order === ordering);

		for (const [key, pkg] of list) {
			console.log(`Publishing ${key}...`);
			console.log(`Package folder: ${pkg.folder}`);
			const packageFolder = path.resolve(contractsPath, pkg.folder);
			// remove the lockfile on CI to allow fresh flows.
			if (isCiJob) {
				console.info('Removing lock file for CI job');
				const lockFile = path.resolve(packageFolder + '/Move.lock');
				if (existsSync(lockFile)) {
					unlinkSync(lockFile);
					console.info('Lock file removed');
				}
			}

			const txb = new Transaction();
			publishPackage(txb, packageFolder, configPath);
			const res = await signAndExecute(txb, network);

			await getClient(network).waitForTransaction({
				digest: res.digest,
			});

			// @ts-ignore-next-line
			const data = pkg.processPublish(res);
			results[key] = data;

			console.info(`Published ${key} with packageId: ${data.packageId}`);

			managePackage(data.packageId, packageFolder, configPath);

			console.info(`Update lock file for package: ${data.packageId}`);
		}
	}
	writeFileSync(
		path.resolve(path.resolve(__dirname, '../'), 'published.json'),
		JSON.stringify(results, null, 2),
	);
	console.log('******* Packages published successfully *******');
	const data = results as PackageInfo;

	// Export the constants based on the SDK's format so SDK can be easily tested.
	writeFileSync(
		path.resolve(path.resolve(__dirname, '../'), 'constants.sdk.json'),
		JSON.stringify(
			{
				iotaNamesPackageId: {
					latest: data.IotaNames.packageId,
					v1: data.IotaNames.packageId,
				},
				iotaNamesObjectId: data.IotaNames.iotaNames,
				subNamesPackageId: data.Subdomains.packageId,
				tempSubNamesProxyPackageId: data.TempSubdomainProxy.packageId,
				paymentsPackageId: data.Payments.packageId,
			},
			null,
			2,
		),
	);

	return data;
};
