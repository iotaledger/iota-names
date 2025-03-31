// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Transaction, TransactionObjectArgument } from '@iota/iota-sdk/transactions';

import { normalizeIotaName } from '../../../sdk/src/utils';
import { readPackageInfo } from '../../config/constants';
import { authorizeApp } from '../../init/authorization';
import { signAndExecute } from '../../utils/utils';

const network = process.env.NETWORK || 'testnet';
const config = readPackageInfo(network);
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

export const calculatePrice = (domain: string, priceInfoObjectId: string) => (tx: Transaction) => {
	const length = normalizeIotaName(domain, 'dot').split('.')[0].length;
	return tx.moveCall({
		target: `${config.packageId}::pricing_config::calculate_base_price`,
		arguments: [tx.object(priceInfoObjectId), tx.pure.u64(length)],
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
			target: `${config.paymentsPackageId}::payments::handle_base_payment`,
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
			target: `${config.paymentsPackageId}::payments::handle_payment`,
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
