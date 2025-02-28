// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { getFullnodeUrl, IotaClient } from '@iota/iota-sdk/client';
import { Transaction } from '@iota/iota-sdk/transactions';

import { IotaNamesClient } from '../src/iota-names-client.js';
import { IotaNamesTransaction } from '../src/iota-names-transaction.js';

// Initialize and execute the IotaNamesClient to fetch the renewal price list
(async () => {
	const network = 'testnet';
	// Step 1: Create a IotaClient instance
	const suiClient = new IotaClient({
		url: getFullnodeUrl(network), // Iota testnet endpoint
	});

	// Step 2: Create a IotaNamesClient instance using TESTNET_CONFIG
	const iotaNamesClient = new IotaNamesClient({
		client: suiClient,
		network,
	});

	/* Following can be used to fetch the coin type discount, registration price, and renewal price */
	console.log(await iotaNamesClient.getPriceList());
	console.log(await iotaNamesClient.getRenewalPriceList());

	/* Following can be used to fetch the domain record */
	console.log('Domain Record: ', await iotaNamesClient.getNameRecord('myname.iota'));

	/* If discount NFT is used */
	// const discountNft = '0xMyDiscountNft'; // This can be a string or a kioskTransactionArgument
	// const discountNftType = await iotaNamesClient.getObjectType(discountNft);

	/* Registration Example Using IOTA */
	const tx = new Transaction();
	const iotaNamesTx = new IotaNamesTransaction(iotaNamesClient, tx);
	const maxPaymentAmount = 5 * 1_000_000; // In MIST of the payment coin type
	const [coin] = iotaNamesTx.transaction.splitCoins('0xMyCoin', [maxPaymentAmount]);

	const nft = iotaNamesTx.register({
		domain: 'myname.iota',
		years: 2,
		coin,
	});

	/* Registration Example Using USDC */
	// const coinConfig = iotaNamesClient.config.coins.USDC; // Specify the coin type used for the transaction
	// const nft = iotaNamesTx.register({
	// 	domain: 'myname.iota',
	// 	years: 2,
	// 	coin,
	// });

	// /* Renew Example */
	// const coinConfig = iotaNamesClient.config.coins.IOTA; // Specify the coin type used for the transaction
	// const priceInfoObjectId = await iotaNamesClient.getPriceInfoObject(tx, coinConfig.feed)[0];
	// iotaNamesTx.renew({
	// 	nft: '0xMyNft',
	// 	years: 2,
	// 	coin,
	// });

	/* Optionally set target address */
	iotaNamesTx.setTargetAddress({ nft, address: '0xMyAddress' });

	/* Optionally set default */
	iotaNamesTx.setDefault('myname.iota');

	/* Optionally set user data */
	iotaNamesTx.setUserData({
		nft,
		value: 'hello',
		key: 'content_hash',
	});

	/* Optionally transfer the NFT */
	iotaNamesTx.transaction.transferObjects([nft], '0xMyAddress');

	/* Optionally transfer coin */
	iotaNamesTx.transaction.transferObjects([coin], '0xMyAddress');

	/* Subname Example */
	// const subnameNft = iotaNamesTx.createSubName({
	// 	parentNft: '0xMyParentNft',
	// 	name: 'name.myname.iota',
	// 	expirationTimestampMs: 1862491339394,
	// 	allowChildCreation: true,
	// 	allowTimeExtension: true,
	// });
	// iotaNamesTx.transaction.transferObjects([subnameNft], 'YOUR_ADDRESS');

	/* Extend Subname Expiration */
	// iotaNamesTx.extendExpiration({
	// 	nft: '0xMySubnameNft',
	// 	expirationTimestampMs: 1862511339394,
	// });
})();
