// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { publishPackages } from './publish';
import { setup } from './setup';

// Extract network argument from command-line arguments
const args = process.argv.slice(2); // Get arguments passed after `node init.ts`
const network = args[0]; // First argument should be the network

export const init = async (network: string | undefined, isCIJob: boolean) => {
	if (!network) {
		throw new Error(
			'Network not defined. Please run `node init.js <network>` (e.g., mainnet, testnet, devnet, localnet)',
		);
	}

	const published = await publishPackages(network, isCIJob, process.env.CLIENT_CONFIG_FILE);
	console.log('Published:', published);
	await setup(published, network);
};

init(network, !!process.env.IS_CI_JOB);
