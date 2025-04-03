// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@iota/iota-sdk/transactions';

import { readPackageInfo } from '../config/constants';
import { prepareMultisigTx } from '../utils/utils';

// TODO provide network parameter
const craftTx = async () => {
	const txb = new Transaction();
	const config = readPackageInfo('devnet');

	const adminCapObj = txb.object(config.adminCap);

	const generalProfits = txb.moveCall({
		target: `${config.packageId}::iota_names::withdraw`,
		arguments: [adminCapObj, txb.object(config.iotaNames)],
	});

	txb.transferObjects([generalProfits], txb.pure.address(config.treasuryAddress!));
	await prepareMultisigTx(txb, 'devnet', config.adminAddress);
};

craftTx();
