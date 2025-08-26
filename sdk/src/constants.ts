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

    // Devnet con expired names
    // devnet: {
    //     adminAddress: '0x52733a8e36d2b8b0e6ce7bb4e4ac929f64965db0ac17593b4aa176dcfa849bf6',
    //     adminCap: '0xa86848d3e7d9fbf58b971d00d204aaea546fcb3f7ee3f03ef2b56222abc04f1a',
    //     auctionPackageId: '0x31899353533e48998c40ad7ac72c56587709f0db96d83c0b236275b4c1b0e89b',
    //     auctionHouseObjectId: '0x5fef349667c6580fac73adf08537af5e3fd9fe0e7e5f400aa75a926b0d7ff146',
    //     coins: {
    //         IOTA: {
    //             type: '0x0000000000000000000000000000000000000000000000000000000000000002::iota::IOTA',
    //             metadataId: '0xf7ceb0424ca93f77858c74aebda8bcd5ffe0f32b82ebcc38afb3ba643d03a5f8',
    //         },
    //     },
    //     iotaNamesObjectId: '0x5ded017bb4198f56d585be9c14cb840c1a5e6d7fbaba41b9c27015d2e1e42f99',
    //     packageId: '0xe41da347640ac9ace37d0ca9e6d2d67f3768232b3ed3cbec7a61e6a5ec85dee2',
    //     paymentsPackageId: '0x00ebe8ffcec0051dda7f4226aed30e02adc71f48e23d9c08276dc9b1e5e6896d',
    //     publisherId: '0x785eda9a9aff5baf034dc515e609234b2dc421016e8e4eaf8fcf707ce462dac6',
    //     registryTableId: '0x097dc75565e293aa7c4fb03f864e076266a87fee4522aac08fdfb8791f3524e2',
    //     reverseRegistryTableId:
    //         '0x6e24f34dcedcd3aa831fdf70c107cb97b9d53c3a867b6bf5f338e317d97693f4',
    //     couponsPackageId: '0x533bed5fb83beafb7d1d1b367f65056921e65a2a79c7dbfa5c9125448d16eab9',
    //     subnamesPackageId: '0x7543e654d5d311fcfd6c14e9c8ea54751a50a4afef6934487c1a1376f63c89da',
    //     tempSubnameProxyPackageId:
    //         '0xf0515d4bb55f84bc60ba5a6962d930f7c98b1956b3ab4a3bc91f399ad8199e28',
    //     upgradeCap: '0xb4342aec939190e0401705c0f4a4b9a2c8d99ea1df67723f37cf43a07ac45dbe',
    // },
    // TODO: Support Mainnet and Testnet
};
