// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export { IotaNamesClient } from './iota-names-client';
export { IotaNamesTransaction } from './iota-names-transaction';
export type { Network, IotaNamesClientConfig, NameRecord } from './types';
export { ALLOWED_METADATA, MIN_LABEL_SIZE, packages } from './constants';
export {
    isSubName,
    isNestedSubName,
    validateYears,
    getConfigType,
    getDomainType,
    getPricelistConfigType,
    getRenewalPricelistConfigType,
    getIotaNamesRegistrationType,
    getIotaSubdomainRegistrationType,
} from './helpers';
export { isValidIotaName } from './utils';
