// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export type PackageInfo = {
    IotaNames: IotaNames;
    DenyList: Package;
    Auction: Auction;
    Coupons: Package;
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
    objectId: string;
    adminCap: string;
};

export type Auction = {
    packageId: string;
    upgradeCap: string;
    objectId: string;
};
