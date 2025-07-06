// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export const MAX_U64 = BigInt('18446744073709551615');
export const MIN_LABEL_SIZE = 3;
export const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Allowed keys for metadata.
 */
export const ALLOWED_METADATA = {
    avatar: 'avatar',
    twitterX: 'twitter/x',
    discord: 'discord',
    github: 'github',
    email: 'email',
    btc: 'btc',
    eth: 'eth',
    ltc: 'ltc',
    doge: 'doge',
    sol: 'sol',
    sui: 'sui',
    website: 'website',
    ipfs: 'ipfs',
    arweave: 'arweave',
};

export const packages = {
    devnet: {
        auctionPackageId: '0x3263bf636c2f60b04a7bf376b0048c36cc0268afee6abaaaceee765d5ea3f3cf',
        auctionHouseObjectId: '0xcb9e1c857825e61211d1ea7507847d8b8145e0a890f3392c56771af2a77c932c',
        packageId: '0xe1284870018484a7a12255aebb737b6b98b47d652b842ea2f324499ff163a648',
        iotaNamesObjectId: '0xa92a67ae8a8c644acfa6dd5a4d8098a20b07b6061cbf36aff8daef3ba892913f',
        subNamesPackageId: '0xa61121b31bc079e3dcc8e8e0c97857bde9eb077cd90070fbec737246161922b1',
        tempSubnameProxyPackageId:
            '0x799739dbc50b5b0aa3f9011c475ddc479673a96b230a2a064178c9a65181d444',
        payments: {
            packageId: '0x1efac8bf200acca64b62ce75557cd7232310fc8c4ea90960487d2908055fc94f',
        },
        coins: {
            IOTA: {
                type: '0x0000000000000000000000000000000000000000000000000000000000000002::iota::IOTA',
            },
        },
        registryTableId: '0x88fa01b1f2462f2f33b593eb205b88158e1f51594102b9748b73f134388a3f2d',
        reverseRegistryTableId:
            '0x1b3840a267efdc30d11b2b7ad2e574cf8483cd4e06bdf7b39c61ee5717ac3fe6',
    },
    // TODO: Support Mainnet and Testnet
};
