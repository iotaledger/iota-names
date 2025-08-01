// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount } from '@iota/dapp-kit';

import { useAuctions } from './useAuctions';

export type { AuctionDetails } from './useAuctions';

export function useGetUserAuctions() {
    const account = useCurrentAccount();

    return useAuctions({
        userAddress: account?.address,
    });
}
