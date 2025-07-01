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
        adminAddress: '0xc6ad000986b4e1333d85554bb754d10b84f272a47af24e405cd9bbb408f7f3f1',
        adminCap: '0x2e8699bb8c60d6cc90e3312c3187db686ea00934ca71bf74825a82ff850c439c',
        auctionPackageId: '0x09787d48f319a227b9f88993da0e7a942399510f796a61bd311451ffaf048464',
        auctionHouseObjectId: '0x24b813d91faab23bd9d41d8753930a2331376a6741010dccb921902bf653d698',
        coins: {
            IOTA: {
                type: '0x0000000000000000000000000000000000000000000000000000000000000002::iota::IOTA',
                metadataId: '0x948bddd26f538f8f719ba6d1cea9914cd0034e38762dc2d1d1af06b50b499843',
            },
        },
        denyListPackageId: '0x0f3776071497cf6c8aac4de65e8e22948b1674f31608856e39d01da54fcaca3c',
        iotaNamesObjectId: '0x7519ce2006d5542e7d46fd49e9e329c0942f387c8ebf4634c9a83643e5083937',
        packageId: '0x456dd6276a754dbf381b480223f833509cbfa2182b11d65d0261ff8c87f0d02d',
        payments: {
            packageId: '0x6d56bede8bd3a57daa85aee4d386eacffbdffba625a2c83b97b9432410bdb649',
        },
        publisherId: '0x070295040f136f2f40c9a947060e6c09f0d0037e15551e6e486fa46976da7717',
        registryTableId: '0xf16e999a2cbdb32d0a61273fffedc2885fcbdb795527fc634818e94b6f3da287',
        reverseRegistryTableId:
            '0xb51c228e574eb61f48cf55d76c99ee44c377f8c10713e58d5175729a6e632456',
        couponsPackageId: '0x7387e61478d09cab1bb533becc7cbecefb0bc144e9bc700c5d2c57b68d85dd92',
        subNamesPackageId: '0x6ccf45a4022aca87d1c0d5bc066583c1c794d485321a8a66a95c75ff0f3e830b',
        tempSubdomainsProxyPackageId:
            '0x87660e4b9084abdb642ce17b225423933c746130032ebef27714d3ffddd50c9a',
        upgradeCap: '0x60a3b69e98b20dd7eebcb01a8b5f9cee0976add97ceb0d590020fc5029fb364a',
    },
};
