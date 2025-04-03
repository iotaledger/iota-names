// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@iota/iota-sdk/transactions';

import { readPackageInfo } from '../config/constants';
import { getClient, signAndExecute } from '../utils/utils';
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
	const config = readPackageInfo(network);
	const configValues = Object.entries(config)
		.map(([key, value]) => value)
		.filter((v) => typeof v === 'string');

	const ownedObjectsPage = await client.getOwnedObjects({
		owner: config.adminAddress,
		options: { showContent: true },
	});

	let objectsToTransfer = [];
	for (const object of ownedObjectsPage.data) {
		for (const configValue of configValues) {
			if (JSON.stringify(object).includes(configValue)) {
				objectsToTransfer.push(object.data?.objectId);
				break;
			}
		}
	}

	const tx = new Transaction();
	tx.transferObjects(objectsToTransfer, newOwner);

	const result = await signAndExecute(tx, network);
	await client.waitForTransaction({ digest: result.digest });
	console.log(`Transaction digest: ${result.digest}`);
};

init(network, newOwner, !!process.env.IS_CI_JOB);
