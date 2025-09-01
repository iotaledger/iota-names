// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { getNetwork, IotaClient, Network } from '@iota/iota-sdk/client';
import { IotaGraphQLClient } from '@iota/iota-sdk/graphql';
import { Transaction } from '@iota/iota-sdk/transactions';
import { NANOS_PER_IOTA, normalizeIotaAddress } from '@iota/iota-sdk/utils';
import { expect } from 'vitest';

import { ALLOWED_METADATA, IotaNamesClient, IotaNamesTransaction } from '../src/index.js';

export const e2eLiveNetworkDryRunFlow = async (network_id: Network) => {
    let network = getNetwork(network_id);
    const client = new IotaClient({ url: network.url });
    let graphQlClient = new IotaGraphQLClient({
        url: network.graphql!,
    });

    let sender;
    if (network.id === Network.Testnet) {
        sender = normalizeIotaAddress(
            '0x32bc9471570ca24fcd1fe5b201ea6894748aa0ddd44d20c68f1a4f99db513aa2',
        );
    } else {
        sender = normalizeIotaAddress('0x2');
    }
    const iotaNamesClient = new IotaNamesClient({
        graphQlClient,
        network: network.id,
    });

    // Getting price lists accurately
    const priceList = await iotaNamesClient.getPriceList();
    const renewalPriceList = await iotaNamesClient.getRenewalPriceList();

    // Expected lists
    let expectedPriceList;
    // TODO: Mainnet
    if (network.id === Network.Testnet) {
        expectedPriceList = new Map([
            [[3, 3], 500000000000],
            [[4, 4], 250000000000],
            [[5, 63], 50000000000],
        ]);
    } else {
        expectedPriceList = new Map([
            [[3, 3], 500000000],
            [[4, 4], 100000000],
            [[5, 63], 10000000],
        ]);
    }

    let expectedRenewalPriceList;
    // TODO: Mainnet
    if (network.id === Network.Testnet) {
        expectedRenewalPriceList = new Map([
            [[3, 3], 500000000000],
            [[4, 4], 250000000000],
            [[5, 63], 50000000000],
        ]);
    } else {
        expectedRenewalPriceList = new Map([
            [[3, 3], 150000000],
            [[4, 4], 50000000],
            [[5, 63], 5000000],
        ]);
    }

    expect(priceList).toEqual(expectedPriceList);
    expect(renewalPriceList).toEqual(expectedRenewalPriceList);

    const tx = new Transaction();

    const iotaNamesTx = new IotaNamesTransaction(iotaNamesClient, tx);

    const uniqueName =
        (Date.now().toString(36) + Math.random().toString(36).substring(2)).repeat(2) + '.iota';

    let gas;
    if (network.id === Network.Testnet) {
        250n;
    } else {
        6n;
    }
    const [coinInput] = iotaNamesTx.transaction.splitCoins(iotaNamesTx.transaction.gas, [
        gas * NANOS_PER_IOTA,
    ]);
    // register random name like mclsl9pbdg8324x154cmclsl9pbdg8324x154c.iota for 2 years.
    const nft = await iotaNamesTx.register({
        name: uniqueName,
        coinConfig: iotaNamesClient.config.coins.IOTA,
        coin: coinInput,
    });
    // Sets the target address of the NFT.
    iotaNamesTx.setTargetAddress({
        nft,
        address: sender,
        isSubname: false,
    });

    iotaNamesTx.setDefault(uniqueName);

    // Sets the avatar of the NFT.
    iotaNamesTx.setUserData({
        nft,
        key: ALLOWED_METADATA.avatar,
        value: '0x0',
    });

    iotaNamesTx.setUserData({
        nft,
        key: ALLOWED_METADATA.ipfs,
        value: '0x1',
    });

    const subNft = iotaNamesTx.createSubname({
        parentNft: nft,
        name: 'node.' + uniqueName,
        expirationTimestampMs: Date.now() + 1000 * 60 * 60 * 24 * 30,
        allowChildCreation: true,
        allowTimeExtension: true,
    });

    // create/remove some leaf names as an NFT
    iotaNamesTx.createLeafSubname({
        parentNft: nft,
        name: 'leaf.' + uniqueName,
        targetAddress: sender,
    });
    iotaNamesTx.removeLeafSubname({ parentNft: nft, name: 'leaf.' + uniqueName });

    // do it for sub nft too
    iotaNamesTx.createLeafSubname({
        parentNft: subNft,
        name: 'leaf.node.' + uniqueName,
        targetAddress: sender,
    });
    iotaNamesTx.removeLeafSubname({ parentNft: subNft, name: 'leaf.node.' + uniqueName });

    // extend expiration a bit further for the subNft
    iotaNamesTx.extendExpiration({
        nft: subNft,
        expirationTimestampMs: Date.now() + 1000 * 60 * 60 * 24 * 30 * 2,
    });

    iotaNamesTx.editSetup({
        parentNft: nft,
        name: 'node.' + uniqueName,
        allowChildCreation: true,
        allowTimeExtension: false,
    });

    // let's go 2 levels deep and edit setups!
    const moreNestedNft = iotaNamesTx.createSubname({
        parentNft: subNft,
        name: 'more.node.' + uniqueName,
        allowChildCreation: true,
        allowTimeExtension: true,
        expirationTimestampMs: Date.now() + 1000 * 60 * 60 * 24 * 30,
    });

    iotaNamesTx.editSetup({
        parentNft: subNft,
        name: 'more.node.' + uniqueName,
        allowChildCreation: false,
        allowTimeExtension: false,
    });

    // do it for sub nft too
    tx.transferObjects([moreNestedNft, subNft, nft, coinInput], tx.pure.address(sender));

    tx.setSender(sender);

    if (network.id === Network.Mainnet) {
        tx.setGasPayment([
            {
                objectId: '0xc7fcf957faeb0cdd9809b2ab43e0a8bf7a945cfdac13e8cba527261fecefa4dd',
                version: '86466933',
                digest: '2F8iuFVJm55J96FnJ99Th493D254BaJkUccbwz5rHFDc',
            },
        ]);
    } else if (network.id === Network.Testnet) {
        tx.setGasPayment([
            {
                objectId: '0x0fc64833fa4961d74f6641cb55b85ee3a85785ff819ba6072a26c3a88285c42e',
                version: '190872930',
                digest: '63H9Lnv6U6m5mCW1qsDpFGH8BgQcJdskPxpvKeYSpKyd',
            },
        ]);
    } else if (network.id === Network.Devnet) {
        tx.setGasPayment([
            {
                objectId: '0x6d8bd71d3b157d82de45e7e7c34f267112e5cf73a1dd7017db4f72d96edf4699',
                version: '14008',
                digest: 'GSAfmLfuEhMgjmocr9vt44teCjhKXHBYWSSUtTroM9oB',
            },
        ]);
    }

    return client.dryRunTransactionBlock({
        transactionBlock: await tx.build({
            client,
        }),
    });
};
