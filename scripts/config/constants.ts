// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

export type PackageInfo = {
	packageId: string;
	packageIdPricing: string;
	upgradeCap?: string;
	publisherId: string;
	adminAddress: string;
	adminCap: string;
	iotaNames: string;
	subNamesPackageId: string;
	tempSubdomainsProxyPackageId: string;
	treasuryAddress?: string;
	paymentsPackageId: string;
	coins: {
		[key: string]: {
			type: string;
			metadataId: string;
		};
	};
	registryTableId: string;
};

export const readPackageInfo = (network: string): PackageInfo => {
	return JSON.parse(readFileSync(path.resolve(__dirname, `${network}_package_info.json`), 'utf8'));
};

export const writePackageInfo = (network: string, packageInfo: PackageInfo) => {
	writeFileSync(
		path.resolve(__dirname, `${network}_package_info.json`),
		JSON.stringify(packageInfo, null, 2),
		'utf8',
	);
};
