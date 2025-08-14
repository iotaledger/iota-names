// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useIotaClientContext } from '@iota/dapp-kit';
import { Network } from '@iota/iota-sdk/client';
import { IOTA_TYPE_ARG } from '@iota/iota-sdk/utils';

import { useBalanceInUSD } from '@/hooks';

import { toNanos } from './amount';

// Fiat price calculation
export function calculatePriceInFiat(price?: string): string {
    if (!price) {
        return '';
    }
    const { network } = useIotaClientContext();
    const priceInNanos = price ? toNanos(price) : null;
    const iotaPrice = priceInNanos
        ? useBalanceInUSD(IOTA_TYPE_ARG, priceInNanos, network as Network)
        : 0;
    const priceInIota = parseFloat(price ?? '0');
    return iotaPrice && priceInIota > 0 ? iotaPrice.toFixed(2) : '';
}
