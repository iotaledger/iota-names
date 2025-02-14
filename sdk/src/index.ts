// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export { IotaNamesClient } from './iota-names-client.js';
export { IotaNamesTransaction } from './iota-names-transaction.js';
export type { Constants, Network, IotaNamesClientConfig } from './types.js';
export {
	getConfigType,
	getDomainType,
	getPricelistConfigType,
	getRenewalPricelistConfigType,
	ALLOWED_METADATA,
	TESTNET_CONFIG,
	MAINNET_CONFIG,
} from './constants.js';
export { isSubName, isNestedSubName } from './helpers.js';
