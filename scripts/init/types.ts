// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export type PackageInfo = {
	IOTANames: IOTANames;
	Utils: Package;
	DenyList: Package;
	Registration: Package;
	Renewal: Package;
	Subdomains: Package;
	TempSubdomainProxy: Package;
};

export type Package = {
	packageId: string;
	upgradeCap: string;
};

export type IOTANames = {
	packageId: string;
	upgradeCap: string;
	publisher: string;
	iotaNames: string;
	adminCap: string;
};
