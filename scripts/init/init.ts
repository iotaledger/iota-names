// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { IotaObjectResponse } from '@iota/iota-sdk/client';
import { Transaction } from '@iota/iota-sdk/transactions';

import { getActiveAddress, getClient, signAndExecute } from '../utils/utils';
import { publishPackages } from './publish';
import { setup } from './setup';

// Extract network argument from command-line arguments
const args = process.argv.slice(2); // Get arguments passed after `node init.ts`
if (args.length !== 2) {
	throw new Error('Invalid number of arguments. Please provide arguments: { network, newOwner }');
}

const network = args[0];
const newOwner = args[1]; // Second argument should be the address of the new owner

export const init = async (
	network: string | undefined,
	newOwner: string | undefined,
	isCIJob: boolean,
) => {
	if (!network)
		throw new Error(
			'`network` not defined. Please run `export NETWORK=mainnet|testnet|devnet|localnet`',
		);

	if (!newOwner)
		throw new Error(
			'`newOwner` not defined. Please provide the new owner address of IOTA-Names, e.g. a multisig address',
		);

	const published = await publishPackages(network, isCIJob, process.env.CLIENT_CONFIG_FILE);
	console.log('Published:', published);
	await setup(published, network);

	const client = getClient(network);
	const res = await client.getOwnedObjects({
		owner: getActiveAddress(),
		options: { showType: true },
	});
	const ownedNonCoinObjects = (res.data as IotaObjectResponse[])
		.filter((x) => x.data?.type !== '0x2::coin::Coin<0x2::iota::IOTA>')
		.map((x) => x.data?.objectId)
		.filter((id): id is string => typeof id === 'string');

	const tx = new Transaction();
	tx.transferObjects(ownedNonCoinObjects, newOwner);

	const result = await signAndExecute(tx, network);
	const response = await client.waitForTransaction({ digest: result.digest });
	console.log(`Transaction digest: ${response.digest}`);
};

init(network, newOwner, !!process.env.IS_CI_JOB);
