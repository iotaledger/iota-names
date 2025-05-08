// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export { IotaNamesClient } from './iota-names-client';
export { IotaNamesTransaction } from './iota-names-transaction';
export type { Network, IotaNamesClientConfig, Config } from './types';
export { ALLOWED_METADATA, mainPackage } from './constants';
export {
    isSubName,
    isNestedSubName,
    validateYears,
    getConfigType,
    getDomainType,
    getPricelistConfigType,
    getRenewalPricelistConfigType,
} from './helpers';
