// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export type PackageInfo = {
    IotaNames: IotaNames;
    DenyList: Package;
    Auction: Package;
    Subdomains: Package;
    Payments: Package;
    TempSubdomainProxy: Package;
};

export type Package = {
    packageId: string;
    upgradeCap: string;
};

export type IotaNames = {
    packageId: string;
    upgradeCap: string;
    publisher: string;
    iotaNames: string;
    adminCap: string;
};
