// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { TransactionArgument, type Transaction } from '@iota/iota-sdk/transactions';

/**
 * A helper to authorize any app in the IotaNames object.
 */
export const authorizeApp = ({
	txb,
	adminCap,
	iotaNames,
	type,
	iotaNamesPackageIdV1,
}: {
	txb: Transaction;
	adminCap: string;
	iotaNames: string;
	type: string;
	iotaNamesPackageIdV1: string;
}) => {
	txb.moveCall({
		target: `${iotaNamesPackageIdV1}::iota_names::authorize_app`,
		arguments: [txb.object(adminCap), txb.object(iotaNames)],
		typeArguments: [type],
	});
};

/**
 * A helper to deauthorize any app that has been authorized on the IotaNames object.
 */
export const deauthorizeApp = ({
	txb,
	adminCap,
	iotaNames,
	type,
	iotaNamesPackageIdV1,
}: {
	txb: Transaction;
	adminCap: string;
	iotaNames: string;
	type: string;
	iotaNamesPackageIdV1: string;
}) => {
	txb.moveCall({
		target: `${iotaNamesPackageIdV1}::iota_names::deauthorize_app`,
		arguments: [txb.object(adminCap), txb.object(iotaNames)],
		typeArguments: [type],
	});
};

/**
 * A helper to call `setup` function for many apps that create a "registry" to hold state.
 */
export const setupApp = ({
	txb,
	adminCap,
	iotaNames,
	target,
	args,
}: {
	txb: Transaction;
	adminCap: string;
	iotaNames: string;
	target: `${string}::${string}`;
	args?: TransactionArgument[];
}) => {
	txb.moveCall({
		target: `${target}::setup`,
		arguments: [txb.object(iotaNames), txb.object(adminCap), ...(args || [])],
	});
};

/**
 * Add a config to the IotaNames object.
 */
export const addConfig = ({
	txb,
	adminCap,
	iotaNames,
	type,
	config,
	iotaNamesPackageIdV1,
}: {
	txb: Transaction;
	adminCap: string;
	iotaNames: string;
	iotaNamesPackageIdV1: string;
	config: TransactionArgument;
	type: string;
}) => {
	txb.moveCall({
		target: `${iotaNamesPackageIdV1}::iota_names::add_config`,
		arguments: [txb.object(adminCap), txb.object(iotaNames), config],
		typeArguments: [type],
	});
};

/**
 * Remove a config from IotaNames object.
 */
export const removeConfig = ({
	txb,
	adminCap,
	iotaNames,
	type,
	iotaNamesPackageIdV1,
}: {
	txb: Transaction;
	adminCap: string;
	iotaNames: string;
	iotaNamesPackageIdV1: string;
	type: string;
}) => {
	txb.moveCall({
		target: `${iotaNamesPackageIdV1}::iota_names::remove_config`,
		arguments: [txb.object(adminCap), txb.object(iotaNames)],
		typeArguments: [type],
	});
};

/**
 * Creates a default `config` which saves the price list and public key.
 */
export const newPriceConfig = ({
	txb,
	iotaNamesPackageIdV1,
	priceList,
	publicKey = [...Array(33).keys()],
}: {
	txb: Transaction;
	iotaNamesPackageIdV1: string;
	priceList: { [key: string]: number };
	publicKey?: number[];
}): TransactionArgument => {
	return txb.moveCall({
		target: `${iotaNamesPackageIdV1}::config::new`,
		arguments: [
			txb.pure.vector('u8', publicKey),
			txb.pure.u64(priceList.three),
			txb.pure.u64(priceList.four),
			txb.pure.u64(priceList.fivePlus),
		],
	});
};

/**
 * Add a registry to the IotaNames object.
 */
export const addRegistry = ({
	txb,
	adminCap,
	iotaNames,
	type,
	registry,
	iotaNamesPackageIdV1,
}: {
	txb: Transaction;
	adminCap: string;
	iotaNames: string;
	iotaNamesPackageIdV1: string;
	registry: TransactionArgument;
	type: string;
}) => {
	txb.moveCall({
		target: `${iotaNamesPackageIdV1}::iota_names::add_registry`,
		arguments: [txb.object(adminCap), txb.object(iotaNames), registry],
		typeArguments: [type],
	});
};

/**
 * Creates a default `registry` which saves direct/reverse lookups.
 * That serves as the main registry for the IotaNames object after adding it.
 */
export const newLookupRegistry = ({
	txb,
	adminCap,
	iotaNamesPackageIdV1,
}: {
	txb: Transaction;
	adminCap: string;
	iotaNamesPackageIdV1: string;
}): TransactionArgument => {
	return txb.moveCall({
		target: `${iotaNamesPackageIdV1}::registry::new`,
		arguments: [txb.object(adminCap)],
	});
};
