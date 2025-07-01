// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@iota/iota-sdk/transactions';

import {
    PackageInfo as NetworkPackageInfo,
    readPackageInfo,
    writePackageInfo,
} from '../package-info/constants';
import { getActiveAddress, getClient, getCoinMetadataId, signAndExecute } from '../utils/utils';
import { authorize } from './authorization';
import { Packages } from './packages';
import { queryRegistryTables } from './queries';
import { PackageInfo } from './types';

export const setup = async (packageInfo: PackageInfo, network: string) => {
    const iotaCoinType =
        '0x0000000000000000000000000000000000000000000000000000000000000002::iota::IOTA';
    const networkPackageInfo: NetworkPackageInfo = {
        adminAddress: getActiveAddress(),
        adminCap: packageInfo.IotaNames.adminCap,
        auctionPackageId: packageInfo.Auction.packageId,
        auctionHouseObjectId: packageInfo.Auction.objectId,
        coins: {
            IOTA: {
                type: iotaCoinType,
                metadataId: await getCoinMetadataId(network, iotaCoinType),
            },
        },
        iotaNamesObjectId: packageInfo.IotaNames.objectId,
        packageId: packageInfo.IotaNames.packageId,
        paymentsPackageId: packageInfo.Payments.packageId,
        publisherId: packageInfo.IotaNames.publisher,
        registryTableId: '',
        reverseRegistryTableId: '',
        couponsPackageId: packageInfo.Coupons.packageId,
        subNamesPackageId: packageInfo.Subnames.packageId,
        tempSubnameProxyPackageId: packageInfo.TempSubnameProxy.packageId,
        upgradeCap: packageInfo.IotaNames.upgradeCap,
    };
    writePackageInfo(network, networkPackageInfo);

    console.log('Setting up packages...');
    const packages = Packages(network);

    const txb = new Transaction();

    for (const [key, pkg] of Object.entries(packageInfo)) {
        const data = packages[key as keyof typeof packages];
        if (data && 'authorizationTypes' in data) {
            const authTypes = data.authorizationTypes(pkg.packageId);
            for (const authType of authTypes) {
                authorize({
                    txb,
                    adminCap: packageInfo.IotaNames.adminCap,
                    iotaNamesObjectId: packageInfo.IotaNames.objectId,
                    type: authType,
                    iotaNamesPackageId: packageInfo.IotaNames.packageId,
                });
            }
        }
    }
    // Call setup functions for our packages.
    packages.Subnames.setupFunction(
        txb,
        packageInfo.Subnames.packageId,
        packageInfo.IotaNames.adminCap,
        packageInfo.IotaNames.objectId,
        packageInfo.IotaNames.packageId,
    );
    packages.IotaNames.setupFunction(
        txb,
        packageInfo.IotaNames.packageId,
        packageInfo.IotaNames.adminCap,
        packageInfo.IotaNames.objectId,
        packageInfo.IotaNames.publisher,
    );
    packages.Payments.setupFunction({
        txb,
        packageId: packageInfo.Payments.packageId,
        adminCap: packageInfo.IotaNames.adminCap,
        iotaNamesObjectId: packageInfo.IotaNames.objectId,
        iotaNamesPackageId: packageInfo.IotaNames.packageId,
    });
    packages.Coupons.setupFunction(
        txb,
        packageInfo.Coupons.packageId,
        packageInfo.IotaNames.adminCap,
        packageInfo.IotaNames.objectId,
    );
    let retries = 0;

    try {
        txb.setGasBudget(1_000_000_000);

        const client = getClient(network);
        let digest = '';
        while (retries < 3) {
            const res = await signAndExecute(txb, network);
            digest = res.digest;
            await client.waitForTransaction({
                digest,
            });

            if (res.effects?.status.status === 'success') break;
            console.log(res);
            console.log('Retrying setup...');
            retries++;

            if (retries === 3) {
                console.error('Failed to set up packages');
                return;
            }
        }

        console.log(`******* Packages set up successfully in ${digest} *******`);

        try {
            const constants = readPackageInfo(network);

            let { registryTableId, reverseRegistryTableId } = await queryRegistryTables(
                client,
                packageInfo.IotaNames.objectId,
                packageInfo.IotaNames.packageId,
            );
            constants.registryTableId = registryTableId;
            constants.reverseRegistryTableId = reverseRegistryTableId;
            constants.auctionHouseObjectId = packageInfo.Auction.objectId;

            writePackageInfo(network, constants);
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
