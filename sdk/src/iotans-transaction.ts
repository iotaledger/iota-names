// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@iota/iota-sdk/bcs';
import type { Transaction } from '@iota/iota-sdk/transactions';
import { isValidIOTANSName, normalizeIOTANSName, IOTA_CLOCK_OBJECT_ID } from '@iota/iota-sdk/utils';

import { ALLOWED_METADATA } from './constants.js';
import { isNestedSubName, isSubName, validateYears } from './helpers.js';
import type { IotansClient } from './iotans-client.js';
import type { ObjectArgument } from './types.js';

export class IotansTransaction {
	#iotansClient: IotansClient;
	transaction: Transaction;

	constructor(client: IotansClient, transaction: Transaction) {
		this.#iotansClient = client;
		this.transaction = transaction;
	}

	/**
	 * Constructs the transaction to renew a name.
	 * Expects the nftId (or a transactionArgument), the number of years to renew
	 * as well as the length category of the domain.
	 *
	 * This only applies for SLDs (Second Level Domains) (e.g. example.iota, test.iota).
	 * You can use `getSecondLevelDomainCategory` to get the category of a domain.
	 */
	renew({ nftId, price, years }: { nftId: ObjectArgument; price: number; years: number }) {
		if (!this.#iotansClient.constants.renewalPackageId)
			throw new Error('Renewal package id not found');
		if (!this.#iotansClient.constants.iotansObjectId) throw new Error('IOTANS Object ID not found');
		validateYears(years);

		this.transaction.moveCall({
			target: `${this.#iotansClient.constants.renewalPackageId}::renew::renew`,
			arguments: [
				this.transaction.object(this.#iotansClient.constants.iotansObjectId),
				this.transaction.object(nftId),
				this.transaction.pure.u8(years),
				this.transaction.splitCoins(this.transaction.gas, [this.transaction.pure.u64(price)]),
				this.transaction.object(IOTA_CLOCK_OBJECT_ID),
			],
		});
	}

	/**
	 * Registers a new SLD name.
	 *
	 * You can get the price by calling `getPrice` on the IotansClient.
	 */
	register({ name, price, years }: { name: string; price: number; years: number }) {
		if (!this.#iotansClient.constants.registrationPackageId)
			throw new Error('Registration package id not found');
		if (!this.#iotansClient.constants.iotansObjectId) throw new Error('IOTANS Object ID not found');
		if (!isValidIOTANSName(name)) throw new Error('Invalid IOTANS name');
		validateYears(years);

		const nft = this.transaction.moveCall({
			target: `${this.#iotansClient.constants.registrationPackageId}::register::register`,
			arguments: [
				this.transaction.object(this.#iotansClient.constants.iotansObjectId),
				this.transaction.pure.string(normalizeIOTANSName(name, 'dot')),
				this.transaction.pure.u8(years),
				this.transaction.splitCoins(this.transaction.gas, [this.transaction.pure.u64(price)]),
				this.transaction.object(IOTA_CLOCK_OBJECT_ID),
			],
		});

		return nft;
	}

	createSubName({
		parentNft,
		name,
		expirationTimestampMs,
		allowChildCreation,
		allowTimeExtension,
	}: {
		parentNft: ObjectArgument;
		name: string;
		expirationTimestampMs: number;
		allowChildCreation: boolean;
		allowTimeExtension: boolean;
	}) {
		if (!isValidIOTANSName(name)) throw new Error('Invalid IOTANS name');
		const isParentSubdomain = isNestedSubName(name);
		if (!this.#iotansClient.constants.iotansObjectId) throw new Error('IOTANS Object ID not found');
		if (!this.#iotansClient.constants.subNamesPackageId)
			throw new Error('Subnames package ID not found');
		if (isParentSubdomain && !this.#iotansClient.constants.tempSubNamesProxyPackageId)
			throw new Error('Subnames proxy package ID not found');

		const subNft = this.transaction.moveCall({
			target: isParentSubdomain
				? `${this.#iotansClient.constants.tempSubNamesProxyPackageId}::subdomain_proxy::new`
				: `${this.#iotansClient.constants.subNamesPackageId}::subdomains::new`,
			arguments: [
				this.transaction.object(this.#iotansClient.constants.iotansObjectId),
				this.transaction.object(parentNft),
				this.transaction.object(IOTA_CLOCK_OBJECT_ID),
				this.transaction.pure.string(normalizeIOTANSName(name, 'dot')),
				this.transaction.pure.u64(expirationTimestampMs),
				this.transaction.pure.bool(!!allowChildCreation),
				this.transaction.pure.bool(!!allowTimeExtension),
			],
		});

		return subNft;
	}

	/**
	 * Builds the PTB to create a leaf subdomain.
	 * Parent can be a `IotansRegistration` or a `SubDomainRegistration` object.
	 * Can be passed in as an ID or a TransactionArgument.
	 */
	createLeafSubName({
		parentNft,
		name,
		targetAddress,
	}: {
		parentNft: ObjectArgument;
		name: string;
		targetAddress: string;
	}) {
		if (!isValidIOTANSName(name)) throw new Error('Invalid IOTANS name');
		const isParentSubdomain = isNestedSubName(name);
		if (!this.#iotansClient.constants.iotansObjectId) throw new Error('IOTANS Object ID not found');
		if (!this.#iotansClient.constants.subNamesPackageId)
			throw new Error('Subnames package ID not found');
		if (isParentSubdomain && !this.#iotansClient.constants.tempSubNamesProxyPackageId)
			throw new Error('Subnames proxy package ID not found');

		this.transaction.moveCall({
			target: isParentSubdomain
				? `${this.#iotansClient.constants.tempSubNamesProxyPackageId}::subdomain_proxy::new_leaf`
				: `${this.#iotansClient.constants.subNamesPackageId}::subdomains::new_leaf`,
			arguments: [
				this.transaction.object(this.#iotansClient.constants.iotansObjectId),
				this.transaction.object(parentNft),
				this.transaction.object(IOTA_CLOCK_OBJECT_ID),
				this.transaction.pure.string(normalizeIOTANSName(name, 'dot')),
				this.transaction.pure.address(targetAddress),
			],
		});
	}

	/**
	 * Removes a leaf subname.
	 */
	removeLeafSubName({ parentNft, name }: { parentNft: ObjectArgument; name: string }) {
		if (!isValidIOTANSName(name)) throw new Error('Invalid IOTANS name');
		const isParentSubdomain = isNestedSubName(name);
		if (!isSubName(name)) throw new Error('This can only be invoked for subnames');
		if (!this.#iotansClient.constants.iotansObjectId) throw new Error('IOTANS Object ID not found');
		if (!this.#iotansClient.constants.subNamesPackageId)
			throw new Error('Subnames package ID not found');
		if (isParentSubdomain && !this.#iotansClient.constants.tempSubNamesProxyPackageId)
			throw new Error('Subnames proxy package ID not found');

		this.transaction.moveCall({
			target: isParentSubdomain
				? `${this.#iotansClient.constants.tempSubNamesProxyPackageId}::subdomain_proxy::remove_leaf`
				: `${this.#iotansClient.constants.subNamesPackageId}::subdomains::remove_leaf`,
			arguments: [
				this.transaction.object(this.#iotansClient.constants.iotansObjectId),
				this.transaction.object(parentNft),
				this.transaction.object(IOTA_CLOCK_OBJECT_ID),
				this.transaction.pure.string(normalizeIOTANSName(name, 'dot')),
			],
		});
	}

	setTargetAddress({
		nft,
		address,
		isSubname,
	}: {
		nft: ObjectArgument;
		address?: string;
		isSubname?: boolean;
	}) {
		if (!this.#iotansClient.constants.iotansObjectId) throw new Error('IOTANS Object ID not found');
		if (!this.#iotansClient.constants.utilsPackageId) throw new Error('Utils package ID not found');

		if (isSubname && !this.#iotansClient.constants.tempSubNamesProxyPackageId)
			throw new Error('Subnames proxy package ID not found');

		this.transaction.moveCall({
			target: isSubname
				? `${this.#iotansClient.constants.tempSubNamesProxyPackageId}::subdomain_proxy::set_target_address`
				: `${this.#iotansClient.constants.utilsPackageId}::direct_setup::set_target_address`,
			arguments: [
				this.transaction.object(this.#iotansClient.constants.iotansObjectId),
				this.transaction.object(nft),
				this.transaction.pure(bcs.option(bcs.Address).serialize(address).toBytes()),
				this.transaction.object(IOTA_CLOCK_OBJECT_ID),
			],
		});
	}

	/** Marks a name as default */
	setDefault(name: string) {
		if (!isValidIOTANSName(name)) throw new Error('Invalid IOTANS name');
		if (!this.#iotansClient.constants.iotansObjectId) throw new Error('IOTANS Object ID not found');
		if (!this.#iotansClient.constants.utilsPackageId) throw new Error('Utils package ID not found');

		this.transaction.moveCall({
			target: `${this.#iotansClient.constants.utilsPackageId}::direct_setup::set_reverse_lookup`,
			arguments: [
				this.transaction.object(this.#iotansClient.constants.iotansObjectId),
				this.transaction.pure.string(normalizeIOTANSName(name, 'dot')),
			],
		});
	}

	editSetup({
		parentNft,
		name,
		allowChildCreation,
		allowTimeExtension,
	}: {
		parentNft: ObjectArgument;
		name: string;
		allowChildCreation: boolean;
		allowTimeExtension: boolean;
	}) {
		if (!isValidIOTANSName(name)) throw new Error('Invalid IOTANS name');
		const isParentSubdomain = isNestedSubName(name);
		if (!this.#iotansClient.constants.iotansObjectId) throw new Error('IOTANS Object ID not found');
		if (!isParentSubdomain && !this.#iotansClient.constants.subNamesPackageId)
			throw new Error('Subnames package ID not found');
		if (isParentSubdomain && !this.#iotansClient.constants.tempSubNamesProxyPackageId)
			throw new Error('Subnames proxy package ID not found');

		this.transaction.moveCall({
			target: isParentSubdomain
				? `${this.#iotansClient.constants.tempSubNamesProxyPackageId}::subdomain_proxy::edit_setup`
				: `${this.#iotansClient.constants.subNamesPackageId}::subdomains::edit_setup`,
			arguments: [
				this.transaction.object(this.#iotansClient.constants.iotansObjectId),
				this.transaction.object(parentNft),
				this.transaction.object(IOTA_CLOCK_OBJECT_ID),
				this.transaction.pure.string(normalizeIOTANSName(name, 'dot')),
				this.transaction.pure.bool(!!allowChildCreation),
				this.transaction.pure.bool(!!allowTimeExtension),
			],
		});
	}

	extendExpiration({
		nft,
		expirationTimestampMs,
	}: {
		nft: ObjectArgument;
		expirationTimestampMs: number;
	}) {
		if (!this.#iotansClient.constants.iotansObjectId) throw new Error('IOTANS Object ID not found');
		if (!this.#iotansClient.constants.subNamesPackageId)
			throw new Error('Subnames package ID not found');

		this.transaction.moveCall({
			target: `${this.#iotansClient.constants.subNamesPackageId}::subdomains::extend_expiration`,
			arguments: [
				this.transaction.object(this.#iotansClient.constants.iotansObjectId),
				this.transaction.object(nft),
				this.transaction.pure.u64(expirationTimestampMs),
			],
		});
	}

	setUserData({
		nft,
		value,
		key,
		isSubname,
	}: {
		nft: ObjectArgument;
		value: string;
		key: string;
		isSubname?: boolean;
	}) {
		if (!this.#iotansClient.constants.iotansObjectId) throw new Error('IOTANS Object ID not found');
		if (!isSubname && !this.#iotansClient.constants.utilsPackageId)
			throw new Error('Utils package ID not found');
		if (isSubname && !this.#iotansClient.constants.tempSubNamesProxyPackageId)
			throw new Error('Subnames proxy package ID not found');

		if (!Object.values(ALLOWED_METADATA).some((x) => x === key)) throw new Error('Invalid key');

		this.transaction.moveCall({
			target: isSubname
				? `${this.#iotansClient.constants.tempSubNamesProxyPackageId}::subdomain_proxy::set_user_data`
				: `${this.#iotansClient.constants.utilsPackageId}::direct_setup::set_user_data`,
			arguments: [
				this.transaction.object(this.#iotansClient.constants.iotansObjectId),
				this.transaction.object(nft),
				this.transaction.pure.string(key),
				this.transaction.pure.string(value),
				this.transaction.object(IOTA_CLOCK_OBJECT_ID),
			],
		});
	}

	/**
	 * Burns an expired NFT to collect storage rebates.
	 */
	burnExpired({ nft, isSubname }: { nft: ObjectArgument; isSubname?: boolean }) {
		if (!this.#iotansClient.constants.iotansObjectId) throw new Error('IOTANS Object ID not found');
		if (!this.#iotansClient.constants.utilsPackageId) throw new Error('Utils package ID not found');

		this.transaction.moveCall({
			target: `${this.#iotansClient.constants.utilsPackageId}::direct_setup::${
				isSubname ? 'burn_expired_subname' : 'burn_expired'
			}`,
			arguments: [
				this.transaction.object(this.#iotansClient.constants.iotansObjectId),
				this.transaction.object(nft),
				this.transaction.object(IOTA_CLOCK_OBJECT_ID),
			],
		});
	}
}
