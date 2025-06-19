// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { IotaTransactionBlockResponse } from '@iota/iota-sdk/client';
import { Transaction } from '@iota/iota-sdk/transactions';
import { NANOS_PER_IOTA } from '@iota/iota-sdk/utils';

import { readPackageInfo } from '../package-info/constants';
import {
    addConfig,
    addCoreConfig,
    addRegistry,
    newLookupRegistry,
    newPaymentsConfig,
    newPriceConfig,
    newRenewalConfig,
    setup,
} from './authorization';
import { createDisplay } from './display-tp';

const parseCorePackageObjects = (data: IotaTransactionBlockResponse) => {
    const packageId = data.objectChanges!.find((x) => x.type === 'published');
    if (!packageId || packageId.type !== 'published') throw new Error('Expected Published object');
    const upgradeCap = parseCreatedObject(data, '0x2::package::UpgradeCap');

    return {
        packageId: packageId.packageId,
        upgradeCap: upgradeCap,
    };
};

const parseCreatedObject = (data: IotaTransactionBlockResponse, objectType: string) => {
    const obj = data.objectChanges!.find(
        (x) => x.type === 'created' && x.objectType === objectType,
    );
    if (!obj || obj.type !== 'created') throw new Error(`Expected ${objectType} object`);

    return obj.objectId;
};

export const Packages = (network: string) => {
    return {
        IotaNames: {
            order: 1,
            folder: 'iota-names',
            processPublish: (data: IotaTransactionBlockResponse) => {
                const { packageId, upgradeCap } = parseCorePackageObjects(data);
                const publisher = parseCreatedObject(data, '0x2::package::Publisher');
                const objectId = parseCreatedObject(
                    data,
                    `${packageId}::iota_names::IotaNames`,
                );
                const adminCap = parseCreatedObject(data, `${packageId}::iota_names::AdminCap`);

                return {
                    packageId,
                    upgradeCap,
                    publisher,
                    objectId,
                    adminCap,
                };
            },
            setupFunction: (
                txb: Transaction,
                packageId: string,
                adminCap: string,
                iotaNamesObjectId: string,
                publisher: string,
            ) => {
                // Adds the default registry where name records and reverse records will live
                addRegistry({
                    txb,
                    adminCap,
                    iotaNamesObjectId,
                    iotaNamesPackageId: packageId,
                    registry: newLookupRegistry({
                        txb,
                        iotaNamesPackageId: packageId,
                        adminCap: adminCap,
                    }),
                    type: `${packageId}::registry::Registry`,
                });
                // Add new core config
                addConfig({
                    txb,
                    adminCap,
                    iotaNamesObjectId,
                    iotaNamesPackageId: packageId,
                    config: addCoreConfig({ txb, latestPackageId: packageId }),
                    type: `${packageId}::core_config::CoreConfig`,
                });
                // Adds the PricingConfig
                addConfig({
                    txb,
                    adminCap,
                    iotaNamesObjectId,
                    iotaNamesPackageId: packageId,
                    config: newPriceConfig({
                        txb,
                        packageId,
                        ranges: [
                            [3, 3],
                            [4, 4],
                            [5, 63],
                        ],
                        prices: [
                            0.5 * Number(NANOS_PER_IOTA),
                            0.1 * Number(NANOS_PER_IOTA),
                            0.01 * Number(NANOS_PER_IOTA),
                        ],
                    }),
                    type: `${packageId}::pricing_config::PricingConfig`,
                });
                // Adds the RenewalConfig
                addConfig({
                    txb,
                    adminCap,
                    iotaNamesObjectId,
                    iotaNamesPackageId: packageId,
                    config: newRenewalConfig({
                        txb,
                        packageId,
                        ranges: [
                            [3, 3],
                            [4, 4],
                            [5, 63],
                        ],
                        prices: [
                            0.15 * Number(NANOS_PER_IOTA),
                            0.05 * Number(NANOS_PER_IOTA),
                            0.005 * Number(NANOS_PER_IOTA),
                        ],
                    }),
                    type: `${packageId}::pricing_config::RenewalConfig`,
                });
                // create display for names
                createDisplay({
                    txb,
                    publisher,
                    isSubdomain: false,
                    iotaNamesPackageId: packageId,
                    network,
                    subdomainsPackageId: packageId,
                });
                // create display for subnames
                createDisplay({
                    txb,
                    publisher,
                    isSubdomain: true,
                    iotaNamesPackageId: packageId,
                    network,
                    subdomainsPackageId: packageId,
                });
            },
            authorizationType: (packageId: string) => `${packageId}::controller::ControllerAuth`, // Authorize the iotaNames controller
        },
        Auction: {
            order: 2,
            folder: 'auction',
            processPublish: (data: IotaTransactionBlockResponse) => {
                const { packageId, upgradeCap } = parseCorePackageObjects(data);
                const objectId = parseCreatedObject(
                    data,
                    `${packageId}::auction::AuctionHouse`,
                );

                return {
                    packageId,
                    upgradeCap,
                    objectId,
                };
            },
            authorizationType: (packageId: string) => `${packageId}::auction::AuctionAuth`,
        },
        DenyList: {
            order: 2,
            folder: 'deny-list',
            processPublish: (data: IotaTransactionBlockResponse) => parseCorePackageObjects(data),
            authorizationType: (packageId: string) => `${packageId}::deny_list::DenyListAuth`,
            setupFunction: (
                txb: Transaction,
                packageId: string,
                adminCap: string,
                iotaNamesObjectId: string,
            ) => {
                setup({ txb, adminCap, iotaNamesObjectId, target: `${packageId}::deny_list` });
            },
        },
        Coupons: {
            order: 2,
            folder: 'coupons',
            processPublish: (data: IotaTransactionBlockResponse) => parseCorePackageObjects(data),
            authorizationType: (packageId: string) => `${packageId}::coupon_house::CouponsAuth`,
            setupFunction: (
                txb: Transaction,
                packageId: string,
                adminCap: string,
                iotaNamesObjectId: string,
            ) => {
                setup({ txb, adminCap, iotaNamesObjectId, target: `${packageId}::coupon_house` });
            },
        },
        Payments: {
            order: 2,
            folder: 'payments',
            processPublish: (data: IotaTransactionBlockResponse) => parseCorePackageObjects(data),
            authorizationType: (packageId: string) => `${packageId}::payments::PaymentsAuth`,
            setupFunction: ({
                txb,
                packageId,
                adminCap,
                iotaNamesObjectId,
                iotaNamesPackageId,
            }: {
                txb: Transaction;
                packageId: string;
                adminCap: string;
                iotaNamesObjectId: string;
                iotaNamesPackageId: string;
            }) => {
                const packageInfo = readPackageInfo(network);
                const paymentsconfig = newPaymentsConfig({
                    txb,
                    packageId,
                    coinType: [packageInfo.coins.IOTA],
                    baseCurrencyType: packageInfo.coins.IOTA.type,
                });
                addConfig({
                    txb,
                    adminCap,
                    iotaNamesObjectId,
                    iotaNamesPackageId,
                    config: paymentsconfig,
                    type: `${packageId}::payments::PaymentsConfig`,
                });
            },
        },
        Subdomains: {
            order: 3,
            folder: 'subdomains',
            processPublish: (data: IotaTransactionBlockResponse) => parseCorePackageObjects(data),
            setupFunction: (
                txb: Transaction,
                packageId: string,
                adminCap: string,
                iotaNamesObjectId: string,
                iotaNamesPackageId: string,
            ) => {
                addConfig({
                    txb,
                    adminCap,
                    iotaNamesObjectId,
                    iotaNamesPackageId,
                    config: txb.moveCall({
                        target: `${packageId}::config::default`,
                    }),
                    type: `${packageId}::config::SubdomainConfig`,
                });
            },
            authorizationType: (packageId: string) => `${packageId}::subdomains::SubdomainsAuth`,
        },
        TempSubdomainProxy: {
            order: 3,
            folder: 'temp-subdomain-proxy',
            processPublish: (data: IotaTransactionBlockResponse) => parseCorePackageObjects(data),
            authorizationType: (packageId: string) =>
                `${packageId}::subdomain_proxy::SubdomainProxyAuth`,
        },
    };
};
