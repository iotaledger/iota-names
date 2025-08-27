// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { IOTA_DECIMALS, safeParseIotaToNanos as parseAmount } from '@iota/iota-sdk/utils';

export function parseIotaToNanos(iota: string) {
    return parseAmount(iota, IOTA_DECIMALS);
}
