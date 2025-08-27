// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import {
    GAS_BALANCE_TOO_LOW_ID,
    INSUFFICIENT_COIN_BALANCE_ID,
    NOT_ENOUGH_BALANCE_ID,
} from '../constants';

export function enoughGas(transactionError: Error | null): boolean {
    return (
        !transactionError?.message.includes(NOT_ENOUGH_BALANCE_ID) &&
        !transactionError?.message.includes(GAS_BALANCE_TOO_LOW_ID) &&
        !transactionError?.message.includes(INSUFFICIENT_COIN_BALANCE_ID)
    );
}
