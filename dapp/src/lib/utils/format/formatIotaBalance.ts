// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { IOTA_DECIMALS } from '@iota/iota-sdk/utils';
import BigNumber from 'bignumber.js';

import { IOTA_TOKEN_STYMBOL } from '@/lib/constants';

export function formatIotaBalance(amount: bigint, includeSymbol: boolean = true): string {
    const formattedBalance = new BigNumber(amount.toString())
        .dividedBy(10 ** IOTA_DECIMALS)
        .toString();
    return includeSymbol ? `${formattedBalance} ${IOTA_TOKEN_STYMBOL}` : formattedBalance;
}
