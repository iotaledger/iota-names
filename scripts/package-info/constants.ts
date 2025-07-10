// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

export type PackageInfo = {
    adminAddress: string;
    adminCap: string;
    auctionPackageId: string;
    auctionHouseObjectId: string;
    coins: {
        [key: string]: {
            type: string;
            metadataId: string;
        };
    };
    couponsPackageId: string;
    iotaNamesObjectId: string;
    packageId: string;
    paymentsPackageId: string;
    publisherId: string;
    registryTableId: string;
    reverseRegistryTableId: string;
    subnamesPackageId: string;
    tempSubnameProxyPackageId: string;
    upgradeCap: string;
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

    // Export the constants based on the SDK's format so SDK can be easily tested.
    writeFileSync(
        path.resolve(__dirname, 'sdk.json'),
        JSON.stringify(
            {
                auctionPackageId: packageInfo.auctionPackageId,
                auctionHouseObjectId: packageInfo.auctionHouseObjectId,
                packageId: packageInfo.packageId,
                iotaNamesObjectId: packageInfo.iotaNamesObjectId,
                subnamesPackageId: packageInfo.subnamesPackageId,
                tempSubnameProxyPackageId: packageInfo.tempSubnameProxyPackageId,
                payments: {
                    packageId: packageInfo.paymentsPackageId,
                },
                coins: packageInfo.coins,
                registryTableId: packageInfo.registryTableId,
                reverseRegistryTableId: packageInfo.reverseRegistryTableId,
            },
            null,
            2,
        ),
    );
};
