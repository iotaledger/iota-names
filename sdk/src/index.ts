// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export { IotaNamesClient } from './iota-names-client';
export { IotaNamesTransaction } from './iota-names-transaction';
export type { IotaNamesClientConfig, NameRecord } from './types';
export { ALLOWED_METADATA, MIN_LABEL_SIZE, GRACE_PERIOD_MS, packages } from './constants';
export {
    isSubname,
    isNestedSubname,
    validateYears,
    getConfigType,
    getNameType,
    getPricelistConfigType,
    getRenewalPricelistConfigType,
    getNameRegistrationType,
    getSubnameRegistrationType,
} from './helpers';
export { isValidIotaName } from './utils';
