// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import type { IotaClient } from '@iota/iota-sdk/client';

import { packages } from './constants.js';
import {
    getConfigType,
    getDomainType,
    getPricelistConfigType,
    getRenewalPricelistConfigType,
    isSubName,
    validateYears,
} from './helpers.js';
import type {
    IotaNamesClientConfig,
    IotaNamesPriceList,
    NameRecord,
    PackageInfo,
} from './types.js';
import { isValidIotaName, normalizeIotaName } from './utils';

/// The IotaNamesClient is the main entry point for the IotaNames SDK.
/// It allows you to interact with IOTA-Names.
export class IotaNamesClient {
    client: IotaClient;
    config: PackageInfo;

    constructor(config: IotaNamesClientConfig) {
        this.client = config.client;

        if ('network' in config) {
            this.config = packages[config.network];
        } else {
            this.config = config.packageInfo;
        }
    }

    /**
     * Returns the price list for IOTA names in the base asset.
     */

    // Format:
    // {
    // 	[ 3, 3 ] => 500000000,
    // 	[ 4, 4 ] => 100000000,
    // 	[ 5, 63 ] => 20000000
    // }
    async getPriceList(): Promise<IotaNamesPriceList> {
        if (!this.config.iotaNames) throw new Error('IotaNames object ID is not set');
        if (!this.config.packageId) throw new Error('Price list config not found');

        const priceList = await this.client.getDynamicFieldObject({
            parentId: this.config.iotaNames,
            name: {
                type: getConfigType(
                    this.config.packageId,
                    getPricelistConfigType(this.config.packageId),
                ),
                value: { dummy_field: false },
            },
        });

        // Ensure the content exists and is a MoveStruct with expected fields
        if (
            !priceList?.data?.content ||
            priceList.data.content.dataType !== 'moveObject' ||
            !('fields' in priceList.data.content)
        ) {
            throw new Error('Price list not found or content is invalid');
        }

        // Safely extract fields
        const fields = priceList.data.content.fields as Record<string, any>;
        if (!fields.value || !fields.value.fields || !fields.value.fields.pricing) {
            throw new Error('Pricing fields not found in the price list');
        }

        const contentArray = fields.value.fields.pricing.fields.contents;
        const priceMap = new Map();

        for (const entry of contentArray) {
            const keyFields = entry.fields.key.fields;
            const key = [Number(keyFields.pos0), Number(keyFields.pos1)]; // Convert keys to numbers
            const value = Number(entry.fields.value); // Convert value to a number

            priceMap.set(key, value);
        }

        return priceMap;
    }

    /**
     * Returns the renewal price list for IOTA names in the base asset.
     */

    // Format:
    // {
    // 	[ 3, 3 ] => 500000000,
    // 	[ 4, 4 ] => 100000000,
    // 	[ 5, 63 ] => 20000000
    // }
    async getRenewalPriceList(): Promise<IotaNamesPriceList> {
        if (!this.config.iotaNames) throw new Error('IotaNames object ID is not set');
        if (!this.config.packageId) throw new Error('Price list config not found');

        const priceList = await this.client.getDynamicFieldObject({
            parentId: this.config.iotaNames,
            name: {
                type: getConfigType(
                    this.config.packageId,
                    getRenewalPricelistConfigType(this.config.packageId),
                ),
                value: { dummy_field: false },
            },
        });

        if (
            !priceList ||
            !priceList.data ||
            !priceList.data.content ||
            priceList.data.content.dataType !== 'moveObject' ||
            !('fields' in priceList.data.content)
        ) {
            throw new Error('Price list not found or content structure is invalid');
        }

        // Safely extract fields
        const fields = priceList.data.content.fields as Record<string, any>;
        if (
            !fields.value ||
            !fields.value.fields ||
            !fields.value.fields.config ||
            !fields.value.fields.config.fields.pricing ||
            !fields.value.fields.config.fields.pricing.fields.contents
        ) {
            throw new Error('Pricing fields not found in the price list');
        }

        const contentArray = fields.value.fields.config.fields.pricing.fields.contents;
        const priceMap = new Map();

        for (const entry of contentArray) {
            const keyFields = entry.fields.key.fields;
            const key = [Number(keyFields.pos0), Number(keyFields.pos1)]; // Convert keys to numbers
            const value = Number(entry.fields.value); // Convert value to a number

            priceMap.set(key, value);
        }

        return priceMap;
    }

    async getNameRecord(name: string): Promise<NameRecord | null> {
        if (!isValidIotaName(name)) throw new Error('Invalid IOTA name');
        if (!this.config.registryTableId) throw new Error('IotaNames package ID is not set');

        const nameRecord = await this.client.getDynamicFieldObject({
            parentId: this.config.registryTableId,
            name: {
                type: getDomainType(this.config.packageId),
                value: normalizeIotaName(name, 'dot').split('.').reverse(),
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
    async calculatePrice({
        name,
        years,
        isRegistration = true,
    }: {
        name: string;
        years: number;
        isRegistration?: boolean;
    }) {
        if (!isValidIotaName(name)) {
            throw new Error('Invalid IOTA names');
        }
        validateYears(years);

        if (isSubName(name)) {
            throw new Error('Subdomains do not have a registration fee');
        }

        const length = normalizeIotaName(name, 'dot').split('.')[0].length;
        const priceList = await this.getPriceList();
        const renewalPriceList = await this.getRenewalPriceList();
        let yearsRemain = years;
        let price = 0;

        if (isRegistration) {
            for (const [[minLength, maxLength], pricePerYear] of priceList.entries()) {
                if (length >= minLength && length <= maxLength) {
                    price += pricePerYear; // Registration is always 1 year
                    yearsRemain -= 1;
                    break;
                }
            }
        }

        for (const [[minLength, maxLength], pricePerYear] of renewalPriceList.entries()) {
            if (length >= minLength && length <= maxLength) {
                price += yearsRemain * pricePerYear;
                break;
            }
        }

        return price;
    }

    async getObjectType(objectId: string) {
        // Fetch the object details from the Iota client
        const objectResponse = await this.client.getObject({
            id: objectId,
            options: { showType: true },
        });

        // Extract and return the type if available
        if (objectResponse && objectResponse.data && objectResponse.data.type) {
            return objectResponse.data.type;
        }

        // Throw an error if the type is not found
        throw new Error(`Type information not found for object ID: ${objectId}`);
    }
}
