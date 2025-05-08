// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@iota/iota-sdk/transactions';
import { NANOS_PER_IOTA } from '@iota/iota-sdk/utils';

import { addConfig, newPriceConfig, newRenewalConfig, removeConfig } from '../init/authorization';
import { PackageInfo, readPackageInfo } from '../package-info/constants';
import { signAndExecute } from '../utils/utils';

const setupIotaNames = (txb: Transaction, packageInfo: PackageInfo) => {
    removeConfig({
        txb,
        adminCap: packageInfo.adminCap,
        iotaNames: packageInfo.iotaNames,
        type: `${packageInfo.packageIdPricing}::pricing_config::PricingConfig`,
        iotaNamesPackageId: packageInfo.packageId,
    });

    removeConfig({
        txb,
        adminCap: packageInfo.adminCap,
        iotaNames: packageInfo.iotaNames,
        type: `${packageInfo.packageIdPricing}::pricing_config::RenewalConfig`,
        iotaNamesPackageId: packageInfo.packageId,
    });

    // Add new price configs
    addConfig({
        txb,
        adminCap: packageInfo.adminCap,
        iotaNames: packageInfo.iotaNames,
        iotaNamesPackageId: packageInfo.packageId,
        config: newPriceConfig({
            txb,
            packageId: packageInfo.packageId,
            ranges: [
                [3, 3],
                [4, 4],
                [5, 63],
            ],
            prices: [
                50 * Number(NANOS_PER_IOTA),
                10 * Number(NANOS_PER_IOTA),
                1 * Number(NANOS_PER_IOTA),
            ],
        }),
        type: `${packageInfo.packageIdPricing}::pricing_config::PricingConfig`,
    });
    addConfig({
        txb,
        adminCap: packageInfo.adminCap,
        iotaNames: packageInfo.iotaNames,
        iotaNamesPackageId: packageInfo.packageId,
        config: newRenewalConfig({
            txb,
            packageId: packageInfo.packageId,
            ranges: [
                [3, 3],
                [4, 4],
                [5, 63],
            ],
            prices: [
                15 * Number(NANOS_PER_IOTA),
                5 * Number(NANOS_PER_IOTA),
                0.5 * Number(NANOS_PER_IOTA),
            ],
        }),
        type: `${packageInfo.packageIdPricing}::pricing_config::RenewalConfig`,
    });
};

const publishSetup = async () => {
    const packageInfo = readPackageInfo('testnet');
    const tx = new Transaction();

    setupIotaNames(tx, packageInfo);

    console.log(await signAndExecute(tx, 'testnet'));
};

publishSetup();
