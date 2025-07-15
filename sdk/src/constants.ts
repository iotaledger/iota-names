// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export const MAX_U64 = BigInt('18446744073709551615');
export const MIN_LABEL_SIZE = 3;
export const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;
export const MAX_RENEWAL_YEARS = 5;
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
        adminAddress: '0x1ca3c38e888493f869ac35346a2041d6cf87b0b935ebba14b35a08811d8a76e4',
        adminCap: '0x5a45ba086c2a873b5d6d34e8503e8ca8850588bf7f301285e279c8dab94eeb73',
        auctionPackageId: '0x79c8714ea294a92da04875c77ccabf8d1a06107e80d41c23d6777d5b1e6724a5',
        auctionHouseObjectId: '0xc922c77a1d4f4e699aa912a7c24aee4668f8975d2a5f01ba780f656289bf2c2c',
        coins: {
            IOTA: {
                type: '0x0000000000000000000000000000000000000000000000000000000000000002::iota::IOTA',
                metadataId: '0xf7ceb0424ca93f77858c74aebda8bcd5ffe0f32b82ebcc38afb3ba643d03a5f8',
            },
        },
        iotaNamesObjectId: '0x07c59b37bd7d036bf78fa30561a2ab9f7a970837487656ec29466e817f879342',
        packageId: '0xb9d617f24c84826bf660a2f4031951678cc80c264aebc4413459fb2a95ada9ba',
        paymentsPackageId: '0x98b9b33b7c2347a8f4e8b8716fb4c7e6e1af846ec2ea063a47bba81ffe03b440',
        publisherId: '0xb9435d6c5f3a7bd85fa362b4b89262cf738d48774695e8e9955704ce0fd3526f',
        registryTableId: '0xe00b2f2400c33b4dbd3081c4dcf2e289d0544caba23a3d130b264bd756403c07',
        reverseRegistryTableId:
            '0x1c1da17843cc453ad4079b05ce55e103b7a8cdd4db6ab42dc367b47ed6d8994d',
        couponsPackageId: '0xf2d61106ef44216f03709276c4e79c78485080c6d8fbad8464b7a570b9f36470',
        subnamesPackageId: '0x1efbf928710d0d92635dacff4c502516169d37fa006cabd2f3cdd0123221e09e',
        tempSubnameProxyPackageId:
            '0x4a16b7b2a9c194989519c87ee3f1d1007ece8aecb62b9a50a4c10075db0591a3',
        upgradeCap: '0xd64205c4b10eff4b4adb00ab6f754cda8d8e7525985a31307f7e232481dfaf6e',
    },
    // TODO: Support Mainnet and Testnet
};
