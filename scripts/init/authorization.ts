// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { TransactionArgument, type Transaction } from '@iota/iota-sdk/transactions';

/**
 * A helper to authorize any app in the IOTANS object.
 */
export const authorizeApp = ({
	txb,
	adminCap,
	iotans,
	type,
	iotansPackageIdV1,
}: {
	txb: Transaction;
	adminCap: string;
	iotans: string;
	type: string;
	iotansPackageIdV1: string;
}) => {
	txb.moveCall({
		target: `${iotansPackageIdV1}::iotans::authorize_app`,
		arguments: [txb.object(adminCap), txb.object(iotans)],
		typeArguments: [type],
	});
};

/**
 * A helper to deauthorize any app that has been authorized on the IOTANS object.
 */
export const deauthorizeApp = ({
	txb,
	adminCap,
	iotans,
	type,
	iotansPackageIdV1,
}: {
	txb: Transaction;
	adminCap: string;
	iotans: string;
	type: string;
	iotansPackageIdV1: string;
}) => {
	txb.moveCall({
		target: `${iotansPackageIdV1}::iotans::deauthorize_app`,
		arguments: [txb.object(adminCap), txb.object(iotans)],
		typeArguments: [type],
	});
};

/**
 * A helper to call `setup` function for many apps that create a "registry" to hold state.
 */
export const setupApp = ({
	txb,
	adminCap,
	iotans,
	target,
	args,
}: {
	txb: Transaction;
	adminCap: string;
	iotans: string;
	target: `${string}::${string}`;
	args?: TransactionArgument[];
}) => {
	txb.moveCall({
		target: `${target}::setup`,
		arguments: [txb.object(iotans), txb.object(adminCap), ...(args || [])],
	});
};

/**
 * Add a config to the IOTANS object.
 */
export const addConfig = ({
	txb,
	adminCap,
	iotans,
	type,
	config,
	iotansPackageIdV1,
}: {
	txb: Transaction;
	adminCap: string;
	iotans: string;
	iotansPackageIdV1: string;
	config: TransactionArgument;
	type: string;
}) => {
	txb.moveCall({
		target: `${iotansPackageIdV1}::iotans::add_config`,
		arguments: [txb.object(adminCap), txb.object(iotans), config],
		typeArguments: [type],
	});
};

/**
 * Remove a config from IOTANS object.
 */
export const removeConfig = ({
	txb,
	adminCap,
	iotans,
	type,
	iotansPackageIdV1,
}: {
	txb: Transaction;
	adminCap: string;
	iotans: string;
	iotansPackageIdV1: string;
	type: string;
}) => {
	txb.moveCall({
		target: `${iotansPackageIdV1}::iotans::remove_config`,
		arguments: [txb.object(adminCap), txb.object(iotans)],
		typeArguments: [type],
	});
};

/**
 * Creates a default `config` which saves the price list and public key.
 */
export const newPriceConfig = ({
	txb,
	iotansPackageIdV1,
	priceList,
	publicKey = [...Array(33).keys()],
}: {
	txb: Transaction;
	iotansPackageIdV1: string;
	priceList: { [key: string]: number };
	publicKey?: number[];
}): TransactionArgument => {
	return txb.moveCall({
		target: `${iotansPackageIdV1}::config::new`,
		arguments: [
			txb.pure.vector('u8', publicKey),
			txb.pure.u64(priceList.three),
			txb.pure.u64(priceList.four),
			txb.pure.u64(priceList.fivePlus),
		],
	});
};

/**
 * Add a registry to the IOTANS object.
 */
export const addRegistry = ({
	txb,
	adminCap,
	iotans,
	type,
	registry,
	iotansPackageIdV1,
}: {
	txb: Transaction;
	adminCap: string;
	iotans: string;
	iotansPackageIdV1: string;
	registry: TransactionArgument;
	type: string;
}) => {
	txb.moveCall({
		target: `${iotansPackageIdV1}::iotans::add_registry`,
		arguments: [txb.object(adminCap), txb.object(iotans), registry],
		typeArguments: [type],
	});
};

/**
 * Creates a default `registry` which saves direct/reverse lookups.
 * That serves as the main registry for the IOTANS object after adding it.
 */
export const newLookupRegistry = ({
	txb,
	adminCap,
	iotansPackageIdV1,
}: {
	txb: Transaction;
	adminCap: string;
	iotansPackageIdV1: string;
}): TransactionArgument => {
	return txb.moveCall({
		target: `${iotansPackageIdV1}::registry::new`,
		arguments: [txb.object(adminCap)],
	});
};
