// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { execSync } from 'child_process';
import * as fs from 'fs';
import path from 'path';
import type { Transaction } from '@iota/iota-sdk/transactions';

import type { Constants } from '../src/types.js';
import { TestToolbox } from './toolbox.js';

const IOTA_BIN = process.env.VITE_IOTA_BIN ?? `iota`;

/**
 * Publishes the contracts and does the initial setups needed.
 * Returns the constants from the contracts.
 * */
export async function publishAndSetupIotaNamesContracts(toolbox: TestToolbox): Promise<Constants> {
	const folder = path.resolve(__dirname, './../../scripts');

	// publishes & sets-up the contracts on our localnet.
	execSync(`cd ${folder} && pnpm publish-and-setup`, {
		env: {
			...process.env,
			PRIVATE_KEY: toolbox.keypair.getSecretKey(),
			IOTA_BINARY: IOTA_BIN,
			NETWORK: 'localnet',
			// we need to set this to a temp file, so that the client uses the correct config.
			CLIENT_CONFIG_FILE: toolbox.configPath,
		},
		// keep logs.
		stdio: 'inherit',
		encoding: 'utf8',
	});

	console.log('IOTA-Names Contract published & set up successfully.');

	return JSON.parse(fs.readFileSync(`${folder}/constants.sdk.json`, 'utf8'));
}

export async function execute(toolbox: TestToolbox, transaction: Transaction) {
	const result = await toolbox.client.signAndExecuteTransaction({
		transaction,
		signer: toolbox.keypair,
		options: {
			showEffects: true,
			showObjectChanges: true,
		},
	});

	await toolbox.client.waitForTransaction({
		digest: result.digest,
	});

	return result;
}
