// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
export type PackageInfo = {
	SuiNS: SuiNS;
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

export type SuiNS = {
	packageId: string;
	upgradeCap: string;
	publisher: string;
	suins: string;
	adminCap: string;
};
