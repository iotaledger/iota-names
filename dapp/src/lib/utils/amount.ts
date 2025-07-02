// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { IOTA_DECIMALS } from '@iota/iota-sdk/utils';
import { BigNumber } from 'bignumber.js';

export function toNanos(iota: string) {
    try {
        return BigInt(new BigNumber(iota).shiftedBy(IOTA_DECIMALS).toNumber());
    } catch {
        return null;
    }
}
