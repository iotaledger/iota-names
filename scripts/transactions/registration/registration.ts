// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { create } from 'domain';
import * as fs from 'fs';
import { getFullnodeUrl, IotaClient } from '@iota/iota-sdk/client';
import { Transaction, TransactionObjectArgument } from '@iota/iota-sdk/transactions';

import { mainPackage, Network } from '../../config/constants';
import { authorizeApp } from '../../init/authorization';
import { getActiveAddress, signAndExecute } from '../../utils/utils';

const network = (process.env.NETWORK as Network) || 'testnet';
const config = mainPackage[network];
const MAX_U64 = BigInt('18446744073709551615');

export const authorizeAppExample = () => {
	const tx = new Transaction();
	authorizeApp({
		txb: tx,
		adminCap: config.adminCap,
		iotaNames: config.iotaNames,
		type: `${config.packageId}::controller::Controller`,
		iotaNamesPackageId: config.packageId,
	});
	return signAndExecute(tx, network);
};

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

export const calculatePrice =
	(baseAmount: TransactionObjectArgument, paymentType: string, priceInfoObjectId: string) =>
	(tx: Transaction) => {
		// Perform the Move call
		return tx.moveCall({
			target: `${config.payments.packageId}::payments::calculate_price`,
			arguments: [
				tx.object(config.iotaNames),
				baseAmount,
				tx.object.clock(),
				tx.object(priceInfoObjectId),
			],
			typeArguments: [paymentType],
		});
	};

// This function is called through the authorized app
export const handleBasePayment =
	(
		paymentIntent: TransactionObjectArgument,
		payment: TransactionObjectArgument,
		paymentType: string,
	) =>
	(tx: Transaction) => {
		return tx.moveCall({
			target: `${config.payments.packageId}::payments::handle_base_payment`,
			arguments: [tx.object(config.iotaNames), paymentIntent, payment],
			typeArguments: [paymentType],
		});
	};

// This function is called through the authorized app
export const handlePayment =
	(
		paymentIntent: TransactionObjectArgument,
		payment: TransactionObjectArgument,
		paymentType: string,
		priceInfoObjectId: string,
		maxAmount: bigint = MAX_U64,
	) =>
	(tx: Transaction) => {
		return tx.moveCall({
			target: `${config.payments.packageId}::payments::handle_payment`,
			arguments: [
				tx.object(config.iotaNames),
				paymentIntent,
				payment,
				tx.object.clock(),
				tx.object(priceInfoObjectId),
				tx.pure.u64(maxAmount), // This is the maximum user is willing to pay
			],
			typeArguments: [paymentType],
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

export const generateReceipt = async (
	tx: Transaction,
	paymentIntent: TransactionObjectArgument,
	priceAfterDiscount: TransactionObjectArgument,
	coinConfig: { type: string; metadataId: string; feed: string },
	options: {
		coinId?: string;
		maxAmount?: bigint;
		infoObjectId?: string;
	} = {},
): Promise<{ receipt: TransactionObjectArgument; priceInfoObjectId?: string }> => {
	const payment = options.coinId
		? tx.splitCoins(tx.object(options.coinId), [priceAfterDiscount])
		: tx.add(zeroCoin(coinConfig.type));
	const receipt = tx.add(handleBasePayment(paymentIntent, payment, coinConfig.type));
	return { receipt };
};
