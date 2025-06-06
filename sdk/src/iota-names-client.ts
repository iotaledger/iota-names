// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { IotaGraphQLClient } from '@iota/iota-sdk/graphql';
import { graphql } from '@iota/iota-sdk/graphql/schemas/2025.2';
import { toB64 } from '@iota/iota-sdk/utils';

import { DomainBcs, PricingConfigBcs } from './bcs.js';
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
    graphQlClient: IotaGraphQLClient;
    config: PackageInfo;

    constructor(config: IotaNamesClientConfig) {
        this.graphQlClient = config.graphQlClient;

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

        const pricingConfigBcsB64 = toB64(
            PricingConfigBcs.serialize({
                dummy_field: false,
            }).toBytes(),
        );

        const priceListResponse: any = await this.graphQlClient.query({
            query: graphql(`
                query getPriceList($parentId: IotaAddress!, $name: DynamicFieldName!) {
                    owner(address: $parentId) {
                        address
                        dynamicField(name: $name) {
                            value {
                                ... on MoveValue {
                                    json
                                }
                            }
                        }
                    }
                }
            `),
            variables: {
                parentId: this.config.iotaNames,
                name: {
                    type: getConfigType(
                        this.config.packageId,
                        getPricelistConfigType(this.config.packageId),
                    ),
                    bcs: pricingConfigBcsB64,
                },
            },
        });

        const priceList = priceListResponse?.data?.owner?.dynamicField?.value?.json?.pricing;
        const contents = priceList?.contents;

        // Ensure the content exists
        if (!contents) {
            throw new Error('Price list not found or content is invalid');
        }

        const priceMap = new Map();
        for (const entry of contents) {
            const { pos0, pos1 } = entry.key;
            const key = [Number(pos0), Number(pos1)]; // Convert keys to numbers
            const value = Number(entry.value); // Convert value to a number

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

        const pricingConfigBcsB64 = toB64(
            PricingConfigBcs.serialize({
                dummy_field: false,
            }).toBytes(),
        );

        const priceListResponse: any = await this.graphQlClient.query({
            query: graphql(`
                query getRenewalPriceList($parentId: IotaAddress!, $name: DynamicFieldName!) {
                    owner(address: $parentId) {
                        address
                        dynamicField(name: $name) {
                            value {
                                ... on MoveValue {
                                    json
                                }
                            }
                        }
                    }
                }
            `),
            variables: {
                parentId: this.config.iotaNames,
                name: {
                    type: getConfigType(
                        this.config.packageId,
                        getRenewalPricelistConfigType(this.config.packageId),
                    ),
                    bcs: pricingConfigBcsB64,
                },
            },
        });

        const priceList =
            priceListResponse?.data?.owner?.dynamicField?.value?.json?.config?.pricing;
        const contents = priceList?.contents;

        // Ensure the content exists
        if (!contents) {
            throw new Error('Price list not found or content is invalid');
        }

        const priceMap = new Map();
        for (const entry of contents) {
            const { pos0, pos1 } = entry.key;
            const key = [Number(pos0), Number(pos1)]; // Convert keys to numbers
            const value = Number(entry.value); // Convert value to a number

            priceMap.set(key, value);
        }

        return priceMap;
    }

    async getNameRecord(name: string): Promise<NameRecord | null> {
        if (!isValidIotaName(name)) throw new Error('Invalid IOTA name');
        if (!this.config.registryTableId) throw new Error('IotaNames package ID is not set');

        const domainBcsB64 = toB64(
            DomainBcs.serialize({
                labels: normalizeIotaName(name, 'dot').split('.').reverse(),
            }).toBytes(),
        );

        const nameRecordResponse: any = await this.graphQlClient.query({
            query: graphql(`
                query getNameRecord($parentId: IotaAddress!, $name: DynamicFieldName!) {
                    owner(address: $parentId) {
                        address
                        dynamicField(name: $name) {
                            value {
                                ... on MoveValue {
                                    json
                                }
                            }
                        }
                    }
                }
            `),
            variables: {
                parentId: this.config.registryTableId,
                name: {
                    type: getDomainType(this.config.packageId),
                    bcs: domainBcsB64,
                },
            },
        });

        const nameRecord = nameRecordResponse.data?.owner?.dynamicField?.value?.json;

        // in case the name record is not found, return null
        if (!nameRecord) return null;

        const fields = nameRecord.data?.contents;

        if (nameRecord.error || !fields)
            throw new Error('Name record not found. This domain is not registered.');

        const data: Record<string, string> = {};
        // TODO: Support fields
        // content.value.fields.data.fields.contents.forEach((item: any) => {
        //     // @ts-ignore-next-line
        //     data[item.fields.key as string] = item.fields.value;
        // });

        return {
            name,
            nftId: nameRecord?.nft_id,
            targetAddress: nameRecord?.target_address!,
            expirationTimestampMs: nameRecord?.expiration_timestamp_ms,
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
}
