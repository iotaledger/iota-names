// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export const MAX_U64 = BigInt('18446744073709551615');
export const MIN_LABEL_SIZE = 3;

/**
 * Allowed keys for metadata.
 */
export const ALLOWED_METADATA = {
    contentHash: 'content_hash',
    avatar: 'avatar',
};

export const packages = {
    devnet: {
        auctionPackageId: '0x5e7a300e640f645a4030aeb507c7be16909e6fa9711e7ca2d4397bbd967d5c50',
        auctionHouseObjectId: '0x31deb8cbd320867089d52c37fed2d443520aac0fc5a957de1f64f9135b83f42b',
        packageId: '0x3ec4826f1d6e0d9f00680b2e9a7a41f03788ee610b3d11c24f41ab0ae71da39f',
        iotaNamesObjectId: '0x54a8a67fad7aa279429e08824e03481dd8b268779353d299d7f8edaa8b8c13b7',
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
    localnet: {
        auctionPackageId: '0x81f18a035222cf931be54156e8e013ac461356cd365c060e88f284e6bc2e045f',
        auctionHouseObjectId: '0x3b11f034089c9f3c0d792af60626c66ff643ec3079c7add47e4f85d53a49800f',
        packageId: '0x66e04dfa5b7319346a3571582482291f99126db413f57d2b035437e6846feacc',
        iotaNamesObjectId: '0x95370776e0278f5ac008550e9823029bbdfdcb12a5647dc944fd6787682b1abf',
        subNamesPackageId: '0xae6cd478658ea8688ddd4b5c59f76e36878fb4ba479104760f2eb534332556e0',
        tempSubdomainsProxyPackageId:
            '0x6d884db51838312bfc39a2af664931c52b3a3143374c4a514b882cf2ee32c2c1',
        payments: {
            packageId: '0x657606371605bf9df58c3d00bec733ccc9ef2f1a80eb59c789f5aba8f214eb11',
        },
        coins: {
            IOTA: {
                type: '0x0000000000000000000000000000000000000000000000000000000000000002::iota::IOTA',
            },
        },
        registryTableId: '0x2a57d1d46471c530dfb07889fb67d1269f0dbe74fa4ba04805bc6bcd450ab450',
        reverseRegistryTableId:
            '0x3343c8780df3e8af0cff93a2ea225d5f27eca87462c19ebc92b22d6d3cf74084',
    },
    // TODO: Support Mainnet and Testnet
};
