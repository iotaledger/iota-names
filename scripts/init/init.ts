// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { publishPackages } from './publish';
import { setup } from './setup';

export const init = async (network: string | undefined, isCIJob: boolean) => {
	if (!network)
		throw new Error(
			'Network not defined. Please run `export NETWORK=mainnet|testnet|devnet|localnet`',
		);

	const published = await publishPackages(network, isCIJob, process.env.CLIENT_CONFIG_FILE);
	console.log('Published:', published);
	await setup(published, network);
};

init(process.env.NETWORK, !!process.env.IS_CI_JOB);
