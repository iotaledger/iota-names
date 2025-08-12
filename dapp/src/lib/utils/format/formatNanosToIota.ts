// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { IOTA_DECIMALS } from '@iota/iota-sdk/utils';
import BigNumber from 'bignumber.js';

import { IOTA_TOKEN_SYMBOL } from '@/lib/constants';

interface FormatBalanceOptions {
    formatRounded?: boolean;
    showSign?: boolean;
    showIotaSymbol?: boolean;
}

export function formatNanosToIota(
    balance: bigint | number | string | BigNumber,
    { formatRounded = true, showSign = false, showIotaSymbol = true }: FormatBalanceOptions = {},
) {
    const bn = new BigNumber(balance).shiftedBy(-1 * IOTA_DECIMALS);
    let formattedBalance = formatAmount(bn);

    if (!formatRounded) {
        formattedBalance = bn.toFormat();
    }

    if (showSign && !formattedBalance.startsWith('-')) {
        formattedBalance = `+${formattedBalance}`;
    }

    return `${formattedBalance}` + (showIotaSymbol ? ' ' + IOTA_TOKEN_SYMBOL : '');
}

export function formatAmount(...args: Parameters<typeof formatAmountParts>) {
    return formatAmountParts(...args)
        .filter(Boolean)
        .join(' ');
}

export function formatAmountParts(amount?: BigNumber | bigint | number | string | null): string[] {
    if (typeof amount === 'undefined' || amount === null) {
        return ['--'];
    }

    let postfix = '';
    let bn = new BigNumber(amount.toString());
    const bnAbs = bn.abs();

    // use absolute value to determine the postfix
    if (bnAbs.gte(1_000_000_000)) {
        bn = bn.shiftedBy(-9);
        postfix = 'B';
    } else if (bnAbs.gte(1_000_000)) {
        bn = bn.shiftedBy(-6);
        postfix = 'M';
    } else if (bnAbs.gte(10_000)) {
        bn = bn.shiftedBy(-3);
        postfix = 'K';
    }

    if (bnAbs.gte(1)) {
        bn = bn.decimalPlaces(2, BigNumber.ROUND_DOWN);
    }

    if (bnAbs.gt(0) && bnAbs.lt(1)) {
        const leadingZeros = countDecimalLeadingZeros(bn.toFormat());

        if (leadingZeros >= 4) {
            return [formatWithSubscript(bn.toFormat(), leadingZeros), postfix];
        } else {
            return [bn.toFormat(leadingZeros + 1), postfix];
        }
    }

    return [bn.toFormat(), postfix];
}

export const countDecimalLeadingZeros = (
    input: BigNumber | bigint | number | string | null,
): number => {
    if (input === null) {
        return 0;
    }

    const [, decimals] = input.toString().split('.');

    if (!decimals) {
        return 0;
    }

    let count = 0;

    for (const digit of decimals) {
        if (digit === '0') {
            count++;
        } else {
            break;
        }
    }

    return count;
};

const SUBSCRIPTS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];

export const formatWithSubscript = (
    input: BigNumber | bigint | number | string | null,
    zeroCount: number,
): string => {
    if (input === null) {
        return '0';
    }

    const [, decimals] = input.toString().split('.');
    const remainder = decimals.slice(zeroCount);

    return `0.0${SUBSCRIPTS[zeroCount]}${remainder}`;
};
