// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Network } from '@iota/iota-sdk/client';
import { describe, expect, it } from 'vitest';

import { e2eLiveNetworkDryRunFlow } from './pre-built';

describe('it should work on live networks', () => {
    // TODO: enable when it's deployed on mainnet
    // it('should work on mainnet', async () => {
    // 	const res = await e2eLiveNetworkDryRunFlow('mainnet');
    // 	expect(res.effects.status.status).toEqual('success');
    // });
    it('should work on testnet', async () => {
        const res = await e2eLiveNetworkDryRunFlow(Network.Testnet);
        expect(res.effects.status.status).toEqual('success');
    });
    it('should work on devnet', async () => {
        const res = await e2eLiveNetworkDryRunFlow(Network.Devnet);
        expect(res.effects.status.status).toEqual('success');
    });
    it('TODO: should work on testnet', async () => {});
});
