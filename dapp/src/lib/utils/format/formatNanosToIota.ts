// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { CoinFormat, formatBalance, IOTA_DECIMALS } from '@iota/iota-sdk/utils';
import { BigNumber } from 'bignumber.js';

import { IOTA_TOKEN_SYMBOL } from '@/lib/constants';

const defaultConfig = BigNumber.config();

function resetBigNumberConfig() {
    BigNumber.config(defaultConfig);
}

interface FormatNanosToIotaOptions {
    formatRounded?: boolean;
    showSign?: boolean;
    showIotaSymbol?: boolean;
    hasCommaSeparator?: boolean;
}

export function formatNanosToIota(
    balance: bigint | number | string,
    {
        formatRounded = true,
        showSign = false,
        showIotaSymbol = true,
        hasCommaSeparator = true,
    }: FormatNanosToIotaOptions = {},
) {
    if (!hasCommaSeparator) {
        BigNumber.config({
            FORMAT: {
                groupSeparator: '',
            },
        });
    }

    const formattedBalance = formatBalance(
        balance,
        IOTA_DECIMALS,
        formatRounded ? CoinFormat.Rounded : CoinFormat.Full,
        showSign,
    );

    resetBigNumberConfig();
    return showIotaSymbol ? `${formattedBalance} ${IOTA_TOKEN_SYMBOL}` : formattedBalance;
}
