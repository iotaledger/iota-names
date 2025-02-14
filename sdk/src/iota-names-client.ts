// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import type { IotaClient } from '@iota/iota-sdk/client';
import { isValidIOTANamesName, normalizeIOTAName } from '@iota/iota-sdk/utils';

import {
	getConfigType,
	getDomainType,
	getPricelistConfigType,
	getRenewalPricelistConfigType,
	MAINNET_CONFIG,
	TESTNET_CONFIG,
} from './constants.js';
import { isSubName, parsePriceListFromConfig, validateYears } from './helpers.js';
import type { Constants, NameRecord, IotaNamesClientConfig, IotaNamesPriceList } from './types.js';

/// The IotaNamesClient is the main entry point for the IOTANamesSDK.
/// It allows you to interact with IOTANames.
export class IotaNamesClient {
	#client: IotaClient;
	constants: Constants = {};

	constructor(config: IotaNamesClientConfig) {
		this.#client = config.client;
		const network = config.network || 'mainnet';

		if (network === 'mainnet') {
			this.constants = MAINNET_CONFIG;
		}

		if (network === 'testnet') {
			this.constants = TESTNET_CONFIG;
		}

		if (config.packageIds) {
			this.constants = { ...(this.constants || {}), ...config.packageIds };
		}
	}

	/**
	 * Returns the price list for IOTA names.
	 */
	async getPriceList(): Promise<IotaNamesPriceList> {
		if (!this.constants.iotaNamesObjectId) throw new Error('IOTANamesobject ID is not set');
		if (!this.constants.iotaNamesPackageId) throw new Error('Price list config not found');

		const priceList = await this.#client.getDynamicFieldObject({
			parentId: this.constants.iotaNamesObjectId,
			name: {
				type: getConfigType(
					this.constants.iotaNamesPackageId.v1,
					getPricelistConfigType(this.constants.iotaNamesPackageId.v1),
				),
				value: { dummy_field: false },
			},
		});

		if (
			priceList?.data?.content?.dataType !== 'moveObject' ||
			!('value' in priceList.data.content.fields)
		)
			throw new Error('Price list not found');

		const contents = priceList.data.content.fields.value as Record<string, any>;

		return parsePriceListFromConfig(contents);
	}

	async getRenewalPriceList(): Promise<IotaNamesPriceList> {
		if (!this.constants.iotaNamesObjectId) throw new Error('IOTANamesobject ID is not set');
		if (!this.constants.iotaNamesPackageId) throw new Error('Price list config not found');
		if (!this.constants.renewalPackageId) throw new Error('Renewal package ID is not set');

		const priceList = await this.#client.getDynamicFieldObject({
			parentId: this.constants.iotaNamesObjectId,
			name: {
				type: getConfigType(
					this.constants.iotaNamesPackageId.v1,
					getRenewalPricelistConfigType(this.constants.renewalPackageId),
				),
				value: { dummy_field: false },
			},
		});

		if (
			!priceList ||
			!priceList.data ||
			!priceList.data.content ||
			priceList.data.content.dataType !== 'moveObject' ||
			!('value' in priceList.data.content.fields)
		)
			throw new Error('Price list not found');

		const contents = (priceList.data.content.fields.value as Record<string, any>)?.fields?.config;

		return parsePriceListFromConfig(contents);
	}

	async getNameRecord(name: string): Promise<NameRecord | null> {
		if (!isValidIOTANamesName(name)) throw new Error('Invalid IOTA name');
		if (!this.constants.iotaNamesPackageId) throw new Error('IOTANamespackage ID is not set');
		if (!this.constants.registryTableId) throw new Error('Registry table ID is not set');

		const nameRecord = await this.#client.getDynamicFieldObject({
			parentId: this.constants.registryTableId,
			name: {
				type: getDomainType(this.constants.iotaNamesPackageId.v1),
				value: normalizeIOTAName(name, 'dot').split('.').reverse(),
			},
		});
		const fields = nameRecord.data?.content;

		// in case the name record is not found, return null
		if (nameRecord.error?.code === 'dynamicFieldNotFound') return null;

		if (nameRecord.error || !fields || fields.dataType !== 'moveObject')
			throw new Error('Name record not found. This domain is not registered.');
		const content = fields.fields as Record<string, any>;

		const data: Record<string, string> = {};
		content.value.fields.data.fields.contents.forEach((item: any) => {
			// @ts-ignore-next-line
			data[item.fields.key as string] = item.fields.value;
		});

		return {
			name,
			nftId: content.value.fields?.nft_id,
			targetAddress: content.value.fields?.target_address!,
			expirationTimestampMs: content.value.fields?.expiration_timestamp_ms,
			data,
			avatar: data.avatar,
			contentHash: data.content_hash,
		};
	}

	/**
	 * Calculates the registration or renewal price for an SLD (Second Level Domain).
	 * It expects a domain name, the number of years and a `IotaNamesPriceList` object,
	 * as returned from `iotaNamesClient.getPriceList()` function, or `iotaNames.getRenewalPriceList()` function.
	 *
	 * It throws an error:
	 * 1. if the name is a subdomain
	 * 2. if the name is not a valid IOTA name
	 * 3. if the years are not between 1 and 5
	 */
	calculatePrice({
		name,
		years,
		priceList,
	}: {
		name: string;
		years: number;
		priceList: IotaNamesPriceList;
	}) {
		if (!isValidIOTANamesName(name)) throw new Error('Invalid IOTA name');
		validateYears(years);
		if (isSubName(name)) throw new Error('Subdomains do not have a registration fee');

		const length = normalizeIOTAName(name, 'dot').split('.')[0].length;
		if (length === 3) return years * priceList.threeLetters;
		if (length === 4) return years * priceList.fourLetters;
		return years * priceList.fivePlusLetters;
	}
}
