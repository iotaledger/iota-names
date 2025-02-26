// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { Transaction, TransactionObjectArgument } from '@iota/iota-sdk/transactions';

import { mainPackage, Network } from '../../config/constants';

const network = (process.env.NETWORK as Network) || 'testnet';
const config = mainPackage[network];

export const initRegistration = (domain: string) => (tx: Transaction) => {
	return tx.moveCall({
		target: `${config.packageId}::payment::init_registration`,
		arguments: [tx.object(config.iotaNames), tx.pure.string(domain)],
	});
};

export const initRenewal = (nft: TransactionObjectArgument, years: number) => (tx: Transaction) => {
	return tx.moveCall({
		target: `${config.packageId}::payment::init_renewal`,
		arguments: [tx.object(config.iotaNames), nft, tx.pure.u8(years)],
	});
};

export const register = (receipt: TransactionObjectArgument) => (tx: Transaction) => {
	return tx.moveCall({
		target: `${config.packageId}::payment::register`,
		arguments: [receipt, tx.object(config.iotaNames), tx.object.clock()],
	});
};

export const renew =
	(receipt: TransactionObjectArgument, nft: TransactionObjectArgument) => (tx: Transaction) => {
		return tx.moveCall({
			target: `${config.packageId}::payment::renew`,
			arguments: [receipt, tx.object(config.iotaNames), nft, tx.object.clock()],
		});
	};

export const zeroCoin = (type: string) => (tx: Transaction) => {
	return tx.moveCall({
		target: '0x2::coin::zero',
		typeArguments: [type],
	});
};
