// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Network } from '@iota/iota-sdk/client';
import { IotaGraphQLClient } from '@iota/iota-sdk/graphql';
import type {
    TransactionObjectArgument,
    TransactionObjectInput,
} from '@iota/iota-sdk/transactions';

import { CouponBcs, CouponHouseBcs } from './bcs';

// Interfaces
// -----------------

export interface CoinConfig {
    type: string;
}

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

export interface NameRecord {
    name: string;
    nftId: string;
    targetAddress: string;
    expirationTimestampMs: number;
    data: Record<string, string>;
    avatar?: string;
}

// Types
// -----------------

export type VersionedPackageId = {
    latest: string;
    v1: string;
    [key: string]: string;
};

export type BaseParams = {
    coinConfig?: CoinConfig;
    coin: TransactionObjectInput;
    couponCodes?: string[];
    address?: string;
};

export type RegistrationParams = BaseParams & {
    name: string;
};

export type RenewalParams = BaseParams & {
    name: string;
    nft: TransactionObjectInput;
    years: number;
};

export type ReceiptParams = {
    paymentIntent: TransactionObjectArgument;
    payment: TransactionObjectArgument;
    coinConfig: CoinConfig;
};

export type CouponHouse = typeof CouponHouseBcs.$inferType;

export type Coupon = typeof CouponBcs.$inferType & {
    couponCode: string;
};

export type IotaNamesClientConfig = {
    graphQlClient: IotaGraphQLClient;
} & IotaNamesClientNetworkConfig;

export type IotaNamesClientNetworkConfig =
    | {
          network: Network;
      }
    | {
          packageInfo: PackageInfo;
      };

export type IotaNamesPriceList = Map<[number, number], number>;

export type IotaNamesCoreConfig = {
    max_years: number;
};
