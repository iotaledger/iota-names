// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

export type PackageInfo = {
	adminAddress: string;
	adminCap: string;
	auctionPackageId: string;
	coins: {
		[key: string]: {
			type: string;
			metadataId: string;
		};
	};
	denyListPackageId: string;
	iotaNames: string;
	packageId: string;
	paymentsPackageId: string;
	publisherId: string;
	registryTableId: string;
	reverseRegistryTableId: string;
	subNamesPackageId: string;
	tempSubdomainsProxyPackageId: string;
	upgradeCap?: string;
};

export const readPackageInfo = (network: string): PackageInfo => {
	return JSON.parse(readFileSync(path.resolve(__dirname, `${network}.json`), 'utf8'));
};

export const writePackageInfo = (network: string, packageInfo: PackageInfo) => {
	writeFileSync(
		path.resolve(__dirname, `${network}.json`),
		JSON.stringify(packageInfo, null, 2),
		'utf8',
	);
};
