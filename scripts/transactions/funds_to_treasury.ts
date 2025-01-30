// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@iota/iota-sdk/transactions';

import { mainPackage } from '../config/constants';
import { prepareMultisigTx } from '../utils/utils';

const craftTx = async () => {
	const txb = new Transaction();
	const config = mainPackage.mainnet;

	const adminCapObj = txb.object(config.adminCap);

	const generalProfits = txb.moveCall({
		target: `${config.packageId}::iotans::withdraw`,
		arguments: [adminCapObj, txb.object(config.iotans)],
	});

	txb.transferObjects([generalProfits], txb.pure.address(config.treasuryAddress!));
	await prepareMultisigTx(txb, 'mainnet', config.adminAddress);
};

craftTx();
