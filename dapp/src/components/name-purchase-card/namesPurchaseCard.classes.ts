// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { NamePurchaseStatus } from './namePurchasedCard.enums';

export const STATUS_LABELS: Record<NamePurchaseStatus, string> = {
    [NamePurchaseStatus.Available]: 'Available',
    [NamePurchaseStatus.Connected]: 'Available',
    [NamePurchaseStatus.Unconnected]: 'Available',
    [NamePurchaseStatus.InAuction]: 'In auction',
    [NamePurchaseStatus.NotPriced]: 'Not priced',
    [NamePurchaseStatus.Unavailable]: 'Unavailable',
};

export const STATUS_COLORS: Record<NamePurchaseStatus, string> = {
    [NamePurchaseStatus.Available]: 'text-names-tertiary-80',
    [NamePurchaseStatus.Connected]: 'text-names-tertiary-80',
    [NamePurchaseStatus.Unconnected]: 'text-green-700 dark:text-green-200',
    [NamePurchaseStatus.InAuction]: 'text-orange-600 dark:text-orange-300',
    [NamePurchaseStatus.NotPriced]: 'text-names-error-80',
    [NamePurchaseStatus.Unavailable]: 'text-names-error-80',
};
