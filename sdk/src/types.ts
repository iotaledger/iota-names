// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0
import type { IotaClient } from '@iota/iota-sdk/client';
import type { TransactionObjectArgument } from '@iota/iota-sdk/transactions';

/** You can pass in a TransactionArgument OR an objectId by string. */
export type ObjectArgument = string | TransactionObjectArgument;

export type Network = 'mainnet' | 'testnet' | 'custom';

export type VersionedPackageId = {
	latest: string;
	v1: string;
	[key: string]: string;
};

// A list of constants
export type Constants = {
	iotansPackageId?: VersionedPackageId;
	iotansObjectId?: string;
	registryTableId?: string;
	utilsPackageId?: string;
	registrationPackageId?: string;
	renewalPackageId?: string;
	subNamesPackageId?: string;
	tempSubNamesProxyPackageId?: string;
};

// The config for the IotansClient.
export type IotansClientConfig = {
	client: IotaClient;
	/**
	 * The network to use. Defaults to mainnet.
	 */
	network?: Network;
	/**
	 * We can pass in custom PackageIds if we want this to
	 * be functional on localnet, devnet, or any other deployment.
	 */
	packageIds?: Constants;
};

/**
 * The price list for IOTANS names.
 */
export type IotansPriceList = {
	threeLetters: number;
	fourLetters: number;
	fivePlusLetters: number;
};

/**
 * A NameRecord entry of IOTANS Names.
 */
export type NameRecord = {
	name: string;
	nftId: string;
	targetAddress: string;
	expirationTimestampMs: number;
	data: Record<string, string>;
	avatar?: string;
	contentHash?: string;
};
