// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { getFullnodeUrl, IotaClient } from '@iota/iota-sdk/client';
import { Transaction } from '@iota/iota-sdk/transactions';
import { normalizeIotaAddress } from '@iota/iota-sdk/utils';

import { ALLOWED_METADATA, IotansClient, IotansTransaction } from '../src';

export const e2eLiveNetworkDryRunFlow = async (network: 'mainnet' | 'testnet') => {
	const client = new IotaClient({ url: getFullnodeUrl(network) });

	const sender = normalizeIotaAddress('0x2');
	const iotansClient = new IotansClient({
		client,
		network,
	});

	const tx = new Transaction();
	const iotansTx = new IotansTransaction(iotansClient, tx);

	const uniqueName =
		(Date.now().toString(36) + Math.random().toString(36).substring(2)).repeat(2) + '.iota';

	const priceList = await iotansClient.getPriceList();
	// const _renewalPriceList = await iotansClient.getRenewalPriceList();
	const years = 1;

	// register test.iota for a year.
	const nft = iotansTx.register({
		name: uniqueName,
		years,
		price: iotansClient.calculatePrice({ name: uniqueName, years, priceList }),
	});
	// Sets the target address of the NFT.
	iotansTx.setTargetAddress({
		nft,
		address: sender,
		isSubname: false,
	});

	iotansTx.setDefault(uniqueName);

	// Sets the avatar of the NFT.
	iotansTx.setUserData({
		nft,
		key: ALLOWED_METADATA.avatar,
		value: '0x0',
	});

	iotansTx.setUserData({
		nft,
		key: ALLOWED_METADATA.contentHash,
		value: '0x1',
	});

	const subNft = iotansTx.createSubName({
		parentNft: nft,
		name: 'node.' + uniqueName,
		expirationTimestampMs: Date.now() + 1000 * 60 * 60 * 24 * 30,
		allowChildCreation: true,
		allowTimeExtension: true,
	});

	// create/remove some leaf names as an NFT
	iotansTx.createLeafSubName({
		parentNft: nft,
		name: 'leaf.' + uniqueName,
		targetAddress: sender,
	});
	iotansTx.removeLeafSubName({ parentNft: nft, name: 'leaf.' + uniqueName });

	// do it for sub nft too
	iotansTx.createLeafSubName({
		parentNft: subNft,
		name: 'leaf.node.' + uniqueName,
		targetAddress: sender,
	});
	iotansTx.removeLeafSubName({ parentNft: subNft, name: 'leaf.node.' + uniqueName });

	// extend expiration a bit further for the subNft
	iotansTx.extendExpiration({
		nft: subNft,
		expirationTimestampMs: Date.now() + 1000 * 60 * 60 * 24 * 30 * 2,
	});

	iotansTx.editSetup({
		parentNft: nft,
		name: 'node.' + uniqueName,
		allowChildCreation: true,
		allowTimeExtension: false,
	});

	// let's go 2 levels deep and edit setups!
	const moreNestedNft = iotansTx.createSubName({
		parentNft: subNft,
		name: 'more.node.' + uniqueName,
		allowChildCreation: true,
		allowTimeExtension: true,
		expirationTimestampMs: Date.now() + 1000 * 60 * 60 * 24 * 30,
	});

	iotansTx.editSetup({
		parentNft: subNft,
		name: 'more.node.' + uniqueName,
		allowChildCreation: false,
		allowTimeExtension: false,
	});

	// do it for sub nft too
	tx.transferObjects([moreNestedNft, subNft, nft], tx.pure.address(sender));

	tx.setSender(sender);

	if (network === 'mainnet') {
		tx.setGasPayment([
			{
				objectId: '0xc7fcf957faeb0cdd9809b2ab43e0a8bf7a945cfdac13e8cba527261fecefa4dd',
				version: '86466933',
				digest: '2F8iuFVJm55J96FnJ99Th493D254BaJkUccbwz5rHFDc',
			},
		]);
	} else if (network === 'testnet') {
		tx.setGasPayment([
			{
				objectId: '0xeb709b97ca3e87e385d019ccb7da4a9bd99f9405f9b0d692f21c9d2e5714f27a',
				version: '169261602',
				digest: 'HJehhEV1N8rqjjHbwDgjeCZJkHPRavMmihTvyTJme2rA',
			},
		]);
	}

	return client.dryRunTransactionBlock({
		transactionBlock: await tx.build({
			client,
		}),
	});
};
