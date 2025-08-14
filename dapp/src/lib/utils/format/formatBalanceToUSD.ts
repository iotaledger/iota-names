// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export function formatBalanceToUSD(balance: bigint): string {
    return balance.toLocaleString('en', {
        style: 'currency',
        currency: 'USD',
    });
}
