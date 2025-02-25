// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'vitest';

// import { e2eLiveNetworkDryRunFlow } from './pre-built';

describe('it should work on live networks', () => {
	// TODO: enable when it's deployed on mainnet
	// 	it('should work on mainnet', async () => {
	// 		const res = await e2eLiveNetworkDryRunFlow('mainnet');
	// 		expect(res.effects.status.status).toEqual('success');
	// 	});

	it('TODO: should work on testnet', async () => {
		// TODO: enable when it's deployed on testnet
		// Commented here as it would otherwise error with `Error: No test found in suite it should work on live networks`
		// 		const res = await e2eLiveNetworkDryRunFlow('testnet');
		// 		expect(res.effects.status.status).toEqual('success');
	});
});
