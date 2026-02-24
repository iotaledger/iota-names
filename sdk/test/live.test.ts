// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Network } from '@iota/iota-sdk/client';
import { describe, expect, it } from 'vitest';

import { e2eLiveNetworkDryRunFlow } from './pre-built';

describe('It should work on live networks', () => {
    it('Should work on mainnet', async () => {
        const res = await e2eLiveNetworkDryRunFlow(Network.Mainnet);
        expect(res.effects.status.status).toEqual('success');
    });
    it('Should work on testnet', async () => {
        const res = await e2eLiveNetworkDryRunFlow(Network.Testnet);
        expect(res.effects.status.status).toEqual('success');
    });
    it('Should work on devnet', async () => {
        const res = await e2eLiveNetworkDryRunFlow(Network.Devnet);
        expect(res.effects.status.status).toEqual('success');
    });
});
