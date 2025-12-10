// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { getNetwork, IotaClient, Network } from '@iota/iota-sdk/client';
import { IotaGraphQLClient } from '@iota/iota-sdk/graphql';
import { Transaction } from '@iota/iota-sdk/transactions';
import { IOTA_TYPE_ARG, NANOS_PER_IOTA, normalizeIotaAddress } from '@iota/iota-sdk/utils';
import { expect } from 'vitest';

import { ALLOWED_METADATA, IotaNamesClient, IotaNamesTransaction } from '../src/index.js';

export const e2eLiveNetworkDryRunFlow = async (network_id: Network) => {
    let network = getNetwork(network_id);
    const client = new IotaClient({ url: network.url });
    let graphQlClient = new IotaGraphQLClient({
        url: network.graphql!,
    });

    let sender;
    if (network.id === Network.Mainnet) {
        sender = normalizeIotaAddress(
            '0x96e5664b870afebcef5534732a067b877cfd3a70e83384b3e61e9ab92a4d3bab',
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
        gas = 250n;
    } else {
        gas = 6n;
    }
    const [coinInput] = iotaNamesTx.transaction.splitCoins(iotaNamesTx.transaction.gas, [
        gas * NANOS_PER_IOTA,
    ]);
    // register random name like mclsl9pbdg8324x154cmclsl9pbdg8324x154c.iota for 2 years.
    const nft = await iotaNamesTx.register({
        name: uniqueName,
        coinConfig: { type: IOTA_TYPE_ARG },
        coin: coinInput,
    });
    // Sets the target address of the NFT.
    iotaNamesTx.setTargetAddress({
        nft,
        address: sender,
        isSubname: false,
    });

    iotaNamesTx.setPublic(uniqueName);

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
                objectId: '0xec38c03899fd44ed837038f1e3659b38e0cc24fd760db72130486280ee933fe1',
                version: '1',
                digest: 'CkJeMaSxggPLp5g9xGA57zf1FeHcuQLVQHJ6Tm7ZME5o',
            },
        ]);
    } else if (network.id === Network.Testnet) {
        tx.setGasPayment([
            {
                objectId: '0x87d3011396b68cb019b9a539b368e1d57143a89ec8114d6d990ccb8c348ecc3e',
                version: '499614772',
                digest: '2F1DFbzvZH5Mb1E9VzuGzQfV7aJt3DvnDnf8w1QvhvAr',
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
