// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@iota/iota-sdk/transactions';

import { readPackageInfo } from '../config/constants';
import { getClient, getIotaNamesRelatedObjects, signAndExecute } from '../utils/utils';
import { publishPackages } from './publish';
import { setup } from './setup';

// Extract `network` and `newOwner` argument from command-line arguments
const args = process.argv.slice(2); // Get arguments passed to the script
if (args.length < 1 || args.length > 2) {
	throw new Error(
		'Invalid number of arguments. You must at least provide the `network` argument, `newOwner` is optional.',
	);
}

const network = args[0]; // First argument should be the network
const newOwner = args[1]; // Second argument should be the address of the new owner

export const init = async (
	network: string | undefined,
	newOwner: string | undefined,
	isCIJob: boolean,
) => {
	if (!network) {
		throw new Error(
			'`network` not defined. Please run `pnpm ts-node init.ts <network>` (e.g., mainnet, testnet, devnet, localnet)',
		);
	}

	const published = await publishPackages(network, isCIJob, process.env.CLIENT_CONFIG_FILE);
	console.log('Published:', published);
	await setup(published, network);

	if (!newOwner) {
		return;
	}

	const client = getClient(network);
	const config = readPackageInfo(network);
	const objectsToTransfer = await getIotaNamesRelatedObjects(config, client);

	const tx = new Transaction();
	tx.transferObjects(objectsToTransfer, newOwner);

	const result = await signAndExecute(tx, network);
	await client.waitForTransaction({ digest: result.digest });
	console.log(`Transaction digest: ${result.digest}`);
};

init(network, newOwner, !!process.env.IS_CI_JOB);
