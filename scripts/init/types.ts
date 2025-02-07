// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export type PackageInfo = {
	IOTANS: IOTANS;
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

export type IOTANS = {
	packageId: string;
	upgradeCap: string;
	publisher: string;
	iotans: string;
	adminCap: string;
};
