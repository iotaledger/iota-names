// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { IotaObjectRef } from '@iota/iota-sdk/client';
import { Transaction, TransactionArgument } from '@iota/iota-sdk/transactions';
import { NANOS_PER_IOTA, IOTA_CLOCK_OBJECT_ID } from '@iota/iota-sdk/utils';

import { mainPackage, PackageInfo } from '../../config/constants';
import reservedObjects from '../../reserved-names/owned-objects.json';
import { prepareMultisigTx } from '../../utils/utils';

const RUN = process.env.RUN_ID || '';

/// iotaledger treasury address.
const ADDRESS_TO_TRANSFER_FUNDS =
	'0x638791b625c4482bc1b917847cdf8aa76fe226c0f3e0a9b1aa595625989e98a1';

const names: Record<string, any[]> = {
	three: [],
	four: [],
	fivePlus: [],
};
const PRICE_LIST: Record<string, bigint> = {
	three: 50n * NANOS_PER_IOTA,
	four: 10n * NANOS_PER_IOTA,
	fivePlus: 2n * NANOS_PER_IOTA,
};

const MAX_NAMES_PER_BATCH = 815;
const YEARS_TO_RENEW = 5n;

function chunkArray(array: any[], batchSize: number = MAX_NAMES_PER_BATCH) {
	const chunkedArray: any[] = [];
	let index = 0;

	while (index < array.length) {
		chunkedArray.push(array.slice(index, index + batchSize));
		index += batchSize;
	}

	return chunkedArray;
}

const parseReservedObjects = () => {
	for (const object of reservedObjects) {
		const length = object.data.content.fields.domain_name.split('.')[0].length;

		const name = {
			objectId: object.data.objectId,
			version: object.data.version,
			digest: object.data.digest,
			type: object.data.type,
			name: object.data.content.fields.domain_name,
			length: object.data.content.fields.domain_name.split('.')[0].length,
		};

		if (length === 3) names.three.push(name);
		else if (length === 4) names.four.push(name);
		else names.fivePlus.push(name);
	}
};
// we always wanna group these.
parseReservedObjects();

// Does withdraw from iotaNames and returns the funds to be used in the PTB.
const withdrawTx = (txb: Transaction, config: PackageInfo) => {
	return txb.moveCall({
		target: `${config.packageId}::iota_names::withdraw`,
		arguments: [txb.object(config.adminCap), txb.object(config.iotaNames)],
	});
};

const renewTx = (
	txb: Transaction,
	config: PackageInfo,
	name: IotaObjectRef,
	price: bigint,
	splitFrom: TransactionArgument,
) => {
	txb.moveCall({
		target: `${config.renewalsPackageId}::renew::renew`,
		arguments: [
			txb.object(config.iotaNames),
			txb.objectRef({
				objectId: name.objectId,
				version: name.version,
				digest: name.digest,
			}),
			txb.pure.u8(5),
			splitFrom,
			txb.object(IOTA_CLOCK_OBJECT_ID),
		],
	});
};

/// First transaction will process 1K 5+ letter names.
export const prepareFirstTransaction = async () => {
	const txb = new Transaction();
	const config = mainPackage.mainnet;

	// let's work with the first batch of 5Plus names (so we need 10 IOTA / name (2*5))
	const batchToWork = chunkArray(names.fivePlus)[0];
	const coin = withdrawTx(txb, config);

	// split 500 + 341 coins
	txb.splitCoins(
		coin,
		[...Array(500).keys()].map((x) => txb.pure.u64(YEARS_TO_RENEW * PRICE_LIST.fivePlus)),
	);
	txb.splitCoins(
		coin,
		[...Array(batchToWork.length - 500).keys()].map((x) =>
			txb.pure.u64(YEARS_TO_RENEW * PRICE_LIST.fivePlus),
		),
	);

	for (const [index, name] of batchToWork.entries()) {
		const splitFrom =
			index < 500
				? { kind: 'NestedResult', index: 1, resultIndex: index }
				: { kind: 'NestedResult', index: 2, resultIndex: index - 500 };

		// @ts-ignore-next-line
		renewTx(txb, config, name, PRICE_LIST.fivePlus, splitFrom);
	}

	// now, we've spent plenty of iota renewing, but we re-withdraw it
	// to make next operations easier to work with.
	const coin2 = withdrawTx(txb, config);

	// merge as one and send to admin
	txb.mergeCoins(coin, [coin2]);

	txb.transferObjects([coin], txb.pure.address(config.adminAddress));

	return prepareMultisigTx(txb, 'mainnet');
};

/// Second and third transactions do the same. They are based off the input
/// gas coin object ID.
/// Both the second and the third are again operating on 1K 5+ letter names.
export const prepareInbetweenTransactions = async (run: string) => {
	const txb = new Transaction();
	const config = mainPackage.mainnet;

	const index = run === '2' ? 1 : run === '3' ? 2 : 3;
	if (!index) throw new Error('Invalid run ID');

	const batchToWork = chunkArray(names.fivePlus)[index];
	const batchSize = batchToWork.length;

	if (batchToWork.length > 500) {
		// split 500
		txb.splitCoins(
			txb.gas,
			[...Array(500).keys()].map((x) => txb.pure.u64(YEARS_TO_RENEW * PRICE_LIST.fivePlus)),
		);
		txb.splitCoins(
			txb.gas,
			[...Array(batchSize - 500).keys()].map((x) =>
				txb.pure.u64(YEARS_TO_RENEW * PRICE_LIST.fivePlus),
			),
		);
	} else {
		txb.splitCoins(
			txb.gas,
			[...Array(batchSize).keys()].map((x) => txb.pure.u64(YEARS_TO_RENEW * PRICE_LIST.fivePlus)),
		);
	}

	for (const [idx, name] of batchToWork.entries()) {
		const splitFrom =
			idx < 500
				? { kind: 'NestedResult', index: 0, resultIndex: idx }
				: { kind: 'NestedResult', index: 1, resultIndex: idx - 500 };

		// @ts-ignore-next-line
		renewTx(txb, config, name, PRICE_LIST.fivePlus, splitFrom);
	}

	// now, we've spent plenty of iota renewing, but we re-withdraw it
	// to make next operations easier to work with.
	const coin2 = withdrawTx(txb, config);

	// merge as one and send to admin
	txb.mergeCoins(txb.gas, [coin2]);

	return prepareMultisigTx(txb, 'mainnet');
};

export const prepareLastTransaction = async () => {
	const txb = new Transaction();
	const config = mainPackage.mainnet;

	txb.splitCoins(
		txb.gas,
		[...Array(names.four.length).keys()].map((x) => txb.pure.u64(YEARS_TO_RENEW * PRICE_LIST.four)),
	);
	// now we shall handle 4 letter names (that's 50 iota / name)
	for (const [idx, name] of names.four.entries()) {
		renewTx(txb, config, name, PRICE_LIST.four, { NestedResult: [0, idx] });
	}

	const firstWithdrawal = withdrawTx(txb, config);
	txb.mergeCoins(txb.gas, [firstWithdrawal]);

	// we'll process 3 letter names 100 at a time, because we need 250 IOTA / name
	const threeLetterBatches = chunkArray(names.three, 100);

	for (const batch of threeLetterBatches) {
		for (const name of batch) {
			renewTx(
				txb,
				config,
				name,
				PRICE_LIST.three,
				txb.splitCoins(txb.gas, [txb.pure.u64(YEARS_TO_RENEW * PRICE_LIST.three)]),
			);
		}
		// we re-get some money to have enough balance for the last batch.
		const withdraw = withdrawTx(txb, config);
		txb.mergeCoins(txb.gas, [withdraw]);
	}

	// transfer profits to treasury in the same PTB :)
	// We transfer 47K from the IotaNames app profits.
	txb.transferObjects(
		[txb.splitCoins(txb.gas, [txb.pure.u64(47_350n * NANOS_PER_IOTA)])],
		txb.pure.address(ADDRESS_TO_TRANSFER_FUNDS),
	);

	return prepareMultisigTx(txb, 'mainnet');
};

if (RUN === '1') prepareFirstTransaction();
else if (RUN === '2' || RUN === '3' || RUN === '4') prepareInbetweenTransactions(RUN);
else prepareLastTransaction();
