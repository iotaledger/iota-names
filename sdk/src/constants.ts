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
        auctionPackageId: {
            v1: '0x79c8714ea294a92da04875c77ccabf8d1a06107e80d41c23d6777d5b1e6724a5',
        },
        auctionHouseObjectId: '0xc922c77a1d4f4e699aa912a7c24aee4668f8975d2a5f01ba780f656289bf2c2c',
        iotaNamesObjectId: '0x07c59b37bd7d036bf78fa30561a2ab9f7a970837487656ec29466e817f879342',
        packageId: {
            v1: '0xb9d617f24c84826bf660a2f4031951678cc80c264aebc4413459fb2a95ada9ba',
            v2: '0xd8d28a7446a93b1cc0ae248d19b649b9f9b5e0b05332a31aa3ab514e4b7aff32',
        },
        paymentsPackageId: {
            v1: '0x98b9b33b7c2347a8f4e8b8716fb4c7e6e1af846ec2ea063a47bba81ffe03b440',
        },
        publisherId: '0xb9435d6c5f3a7bd85fa362b4b89262cf738d48774695e8e9955704ce0fd3526f',
        registryTableId: '0xe00b2f2400c33b4dbd3081c4dcf2e289d0544caba23a3d130b264bd756403c07',
        reverseRegistryTableId:
            '0x1c1da17843cc453ad4079b05ce55e103b7a8cdd4db6ab42dc367b47ed6d8994d',
        couponsPackageId: {
            v1: '0xf2d61106ef44216f03709276c4e79c78485080c6d8fbad8464b7a570b9f36470',
        },
        subnamesPackageId: {
            v1: '0x1efbf928710d0d92635dacff4c502516169d37fa006cabd2f3cdd0123221e09e',
            v2: '0x33a55ad1d2c0b84a96837470c3a9ce2836e9bcb047daf2b3c8251b260227d850',
        },
        tempSubnameProxyPackageId: {
            v1: '0x4a16b7b2a9c194989519c87ee3f1d1007ece8aecb62b9a50a4c10075db0591a3',
        },
        upgradeCap: '0xd64205c4b10eff4b4adb00ab6f754cda8d8e7525985a31307f7e232481dfaf6e',
    },
    testnet: {
        adminAddress: '0x548474360f9769077ccf07ff6e65060eb448470eabc1ae42b9ed371ddbfc23d2',
        adminCap: '0x541b117cac18fb1c07a293db300acd12b05c01fa81232b37151b005ca7d4f755',
        auctionPackageId: {
            v1: '0x6f727ea576a00036657fff0ae3a6d7c8171b178bf35112d6b83b2a6272cc5f0d',
        },
        auctionHouseObjectId: '0x2292ea885039babe8c320f19e0b7546ebdef2b2f6cf2be600bf994cdb51e0050',
        iotaNamesObjectId: '0x7cab491740d51e0d75b26bf9984e49ba2e32a2d0694cabcee605543ed13c7dec',
        packageId: {
            v1: '0x7fff6e95f385349bec98d17121ab2bfa3e134f2f0b1ccefc270313415f7835ea',
            v2: '0x7aec8176867a0c8d2803d758ebf98226d301ef0f00393879ea718f6bd1554f16',
        },
        paymentsPackageId: {
            v1: '0x6b1b01f4c72786a893191d5c6e73d3012f7529f86fdee3bc8c163323cee08441',
        },
        publisherId: '0x42faed18f40323158fb9b0f38630800addc2e9eea696265756769fc1f0e08ceb',
        registryTableId: '0x2dfc6f6d46ba55217425643a59dc85fe4d8ed273a9f74077bd0ee280dbb4f590',
        reverseRegistryTableId:
            '0x3550bcacb793ef8b776264665e7c99fa3d897695ed664656aac693cf9cf9b76b',
        couponsPackageId: {
            v1: '0xa7e4e483d79c245470d5eb3c285a4503a78d90a69d36e35e0993012f5c6137ca',
        },
        subnamesPackageId: {
            v1: '0xd06a5607cc762f2352eeeb8c86c7f962558a06c6023c1eec031a41651d898c87',
            v2: '0x3d3139995f0050d31d1f32464df69fe4eff5c7b573adde97ffcb8cb37da33948',
        },
        tempSubnameProxyPackageId: {
            v1: '0x7f34c135e55e5b436b3feaad369eabfe5b6d14c0c57544fefb6921db047e8cbc',
        },
        upgradeCap: '0x03ac547ee58c268a69b5663a1fdee0e8202206922968d2a387104730627d188e',
    },
    mainnet: {
        adminAddress: '0xe0f49be393bfebfa72940c1b2ee0dba53c2a003cea0380b352b06fa925903ecc',
        adminCap: '0xdb6122602b71b04995feff7017553e0958d04daeba77bae66df407d8ae8d8611',
        auctionPackageId: {
            v1: '0x7f58de1c1a2664390d410382c8958098374baa0c6a937e2faac21ea783fe6824',
        },
        auctionHouseObjectId: '0x3694c17bbcf60c916b2484a76e9a3f7289d214fd7a43b554dcdce0c2ffc04295',
        iotaNamesObjectId: '0xa14e5d0481a7aa346157078e6facba3cd895d97038cd87b9f2cc24b0c6102d75',
        packageId: {
            v1: '0x6d2c743607ef275bd6934fe5c2a7e5179cca6fbd2049cfa79de2310b74f3cf83',
        },
        paymentsPackageId: {
            v1: '0x53d3d37f00949a1baad95fa4fca0b3d0d70ff6121be316f9e46d37c2d29c71eb',
        },
        publisherId: '0xf2a07cc3ee5dce4e3bab9bf63f39976ea6ac53eb3c5876b4ccecfb0d0376fd54',
        registryTableId: '0xa773cef7d762871354f6ae19ad174dfb1153d2d247c4886ada0b5330b9543b57',
        reverseRegistryTableId:
            '0x18fa62ab8b0ab95ae61088082bd5db796863016fda8f3205b1ea7d13b1792317',
        couponsPackageId: {
            v1: '0x6c16703f7b8fc1bfd90b0d412edf3dcc898787b51068eef28d7e38b454638f4e',
        },
        subnamesPackageId: {
            v1: '0x772859a9d860acc1e49905cf3bd4bedd932cf2a172c3802714dbea5b2acc6420',
        },
        tempSubnameProxyPackageId: {
            v1: '0x868e32df312bd642086e4745c1d05aaafc1a51d0e001a7be399e3894a6714b9f',
        },
        upgradeCap: '0x1a1175e4214a62bc74d9d225116b8bd84557d08aec65b7a5ca7d522208c160ff',
    },
    // REPLACE PLACEHOLDER (don't remove)
};
