// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { formatExpirationDate } from './format/formatExpirationDate';

export function getDefaultExpirationDate(): string {
    return formatExpirationDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
}

export function getDefaultExpirationDateWithRenewYears(renewYears: number): string {
    return formatExpirationDate(new Date(Date.now() + renewYears * 365 * 24 * 60 * 60 * 1000));
}
