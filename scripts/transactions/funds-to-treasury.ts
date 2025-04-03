// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@iota/iota-sdk/transactions';

import { readPackageInfo } from '../config/constants';
import { prepareMultisigTx } from '../utils/utils';

// Extract `treasuryAddress` argument from command-line arguments
const args = process.argv.slice(2); // Get arguments passed to the script
if (args.length !== 1) {
	throw new Error('Invalid number of arguments. You must provide the `treasuryAddress` argument.');
}

const treasuryAddress = args[0]; // First argument should be treasury address

// TODO provide network parameter
const craftTx = async () => {
	const txb = new Transaction();
	const config = readPackageInfo('devnet');

	const adminCapObj = txb.object(config.adminCap);

	const generalProfits = txb.moveCall({
		target: `${config.packageId}::iota_names::withdraw`,
		arguments: [adminCapObj, txb.object(config.iotaNames)],
	});

	txb.transferObjects([generalProfits], txb.pure.address(treasuryAddress));
	await prepareMultisigTx(txb, 'devnet', config.adminAddress);
};

craftTx();
