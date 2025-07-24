// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { getNetwork, Network } from '@iota/iota-sdk/client';
import { IotaGraphQLClient } from '@iota/iota-sdk/graphql';

import { IotaNamesClient } from '../src/iota-names-client.js';

const COUPONS = [
    '20_OFF',
    'Mario_10000_OFF',
    'EXPIRED',
    '1_OFF_STACKABLE',
    '1_YEAR_RENEW_STACKABLE_10%',
    '10_CHARS_50%_OFF',
];

(async () => {
    const network = Network.Devnet;

    const { graphql } = getNetwork(network);
    const graphQlClient = new IotaGraphQLClient({ url: graphql! });

    const iotaNamesClient = new IotaNamesClient({
        graphQlClient,
        network,
    });

    const couponPromises = COUPONS.map(async (coupon) => {
        const couponObj = await iotaNamesClient.resolveCoupon(coupon);
        return couponObj;
    });

    const resolvedCoupons = await Promise.all(couponPromises);

    resolvedCoupons.forEach((coupon, index) => {
        console.log(`Coupon ${index + 1}:`, coupon);
    });
})();
