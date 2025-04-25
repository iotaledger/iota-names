// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import type { Config } from './types.js';

export const MAX_U64 = BigInt('18446744073709551615');

/**
 * Allowed keys for metadata.
 */
export const ALLOWED_METADATA = {
    contentHash: 'content_hash',
    avatar: 'avatar',
};

export const mainPackage: Config = {
    devnet: {
        auctionPackageId: '0x5e7a300e640f645a4030aeb507c7be16909e6fa9711e7ca2d4397bbd967d5c50',
        packageId: '0x3ec4826f1d6e0d9f00680b2e9a7a41f03788ee610b3d11c24f41ab0ae71da39f',
        packageIdPricing: '0x3ec4826f1d6e0d9f00680b2e9a7a41f03788ee610b3d11c24f41ab0ae71da39f',
        iotaNames: '0x54a8a67fad7aa279429e08824e03481dd8b268779353d299d7f8edaa8b8c13b7',
        subNamesPackageId: '0x2e541b250f53d45e9b4cb866be2ab3d8815015a249a094e63b196cc184278925',
        tempSubdomainsProxyPackageId:
            '0x3f2927e8e78a094bb98271fd73e06a3aa056edfecbf32dddb8a65d30de9b8a3f',
        payments: {
            packageId: '0x882f88d252a650649f490e96e32e53979758fdda645863ca856d83c72d5e0e72',
        },
        coins: {
            IOTA: {
                type: '0x0000000000000000000000000000000000000000000000000000000000000002::iota::IOTA',
            },
        },
        registryTableId: '0xef24c78e8c085e29760d37b287fc16647f0f578e8d22f18dd65f655285afad3e',
        reverseRegistryTableId:
            '0x566dc13eafceaf8c3487ee2c41464553839ef4d50937c63741e359c98080c7b6',
    },
    mainnet: {
        auctionPackageId: '',
        packageId: '',
        packageIdPricing: '',
        iotaNames: '',
        subNamesPackageId: '',
        tempSubdomainsProxyPackageId: '',
        payments: {
            packageId: '',
        },
        coins: {
            IOTA: {
                type: '',
            },
        },
        registryTableId: '',
        reverseRegistryTableId: '',
    },
    testnet: {
        auctionPackageId: '',
        packageId: '',
        packageIdPricing: '',
        iotaNames: '',
        subNamesPackageId: '',
        tempSubdomainsProxyPackageId: '',
        payments: {
            packageId: '',
        },
        /// Testnet coins will be different here for testing purposes, we can publish our own
        coins: {
            IOTA: {
                type: '',
            },
        },
        registryTableId: '',
        reverseRegistryTableId: '',
    },
};
