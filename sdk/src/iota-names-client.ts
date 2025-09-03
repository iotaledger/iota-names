// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@iota/iota-sdk/bcs';
import { IotaGraphQLClient } from '@iota/iota-sdk/graphql';
import { graphql } from '@iota/iota-sdk/graphql/schemas/2025.2';
import { fromB64, toB64 } from '@iota/iota-sdk/utils';
import { blake2b } from '@noble/hashes/blake2';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

import { CouponBcs, CouponHouseBcs, DummyFieldBcs, NameBcs } from './bcs.js';
import { ALLOWED_METADATA, packages } from './constants.js';
import { applyCouponsToPrice, validateCoupons } from './coupons.js';
import {
    getConfigType,
    getCoreConfigType,
    getNameType,
    getPricelistConfigType,
    getRenewalPricelistConfigType,
    isSubname,
    validateYears,
} from './helpers.js';
import type {
    Coupon,
    CouponHouse,
    IotaNamesClientConfig,
    IotaNamesCoreConfig,
    IotaNamesPriceList,
    NameRecord,
    PackageInfo,
} from './types.js';
import { isValidIotaName, normalizeIotaName, validateIotaName } from './utils.js';

/// The IotaNamesClient is the main entry point for the IotaNames SDK.
/// It allows you to interact with IOTA-Names.
export class IotaNamesClient {
    graphQlClient: IotaGraphQLClient;
    config: PackageInfo;

    constructor(config: IotaNamesClientConfig) {
        this.graphQlClient = config.graphQlClient;

        if ('network' in config) {
            this.config = packages[config.network as keyof typeof packages];
        } else {
            this.config = config.packageInfo;
        }
    }

    /**
     * Returns the core config of IOTA Names.
     */
    async getCoreConfig(): Promise<IotaNamesCoreConfig> {
        if (!this.config.iotaNamesObjectId) throw new Error('IotaNames object ID is not set');
        if (!this.config.packageId) throw new Error('IotaNames package ID is not set');

        const coreConfigBcsB64 = toB64(
            DummyFieldBcs.serialize({
                dummy_field: false,
            }).toBytes(),
        );

        const coreConfigResponse: any = await this.graphQlClient.query({
            query: graphql(`
                query getCoreConfig($parentId: IotaAddress!, $name: DynamicFieldName!) {
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
                parentId: this.config.iotaNamesObjectId,
                name: {
                    type: getConfigType(
                        this.config.packageId,
                        getCoreConfigType(this.config.packageId),
                    ),
                    bcs: coreConfigBcsB64,
                },
            },
        });

        const coreConfig = coreConfigResponse?.data?.owner?.dynamicField?.value?.json;

        if (!coreConfig) {
            throw new Error('Core config not found or is invalid');
        }

        return coreConfig;
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
        if (!this.config.iotaNamesObjectId) throw new Error('IotaNames object ID is not set');
        if (!this.config.packageId) throw new Error('IotaNames package ID is not set');

        const pricingConfigBcsB64 = toB64(
            DummyFieldBcs.serialize({
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
                parentId: this.config.iotaNamesObjectId,
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
    // 	[ 3, 3 ] => 500000000000,
    // 	[ 4, 4 ] => 250000000000,
    // 	[ 5, 63 ] => 50000000000
    // }
    async getRenewalPriceList(): Promise<IotaNamesPriceList> {
        if (!this.config.iotaNamesObjectId) throw new Error('IotaNames object ID is not set');
        if (!this.config.packageId) throw new Error('IotaNames package ID is not set');

        const pricingConfigBcsB64 = toB64(
            DummyFieldBcs.serialize({
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
                parentId: this.config.iotaNamesObjectId,
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

    async getDefaultName(address: string): Promise<string | null> {
        const response: any = await this.graphQlClient.query({
            query: graphql(`
                query resolveNameServiceName($address: IotaAddress!, $nameFormat: NameFormat) {
                    address(address: $address) {
                        iotaNamesDefaultName(format: $nameFormat)
                    }
                }
            `),
            variables: {
                address,
            },
        });

        const defaultName = response?.data?.address?.iotaNamesDefaultName ?? null;

        return defaultName;
    }

    async getNameRecord(name: string): Promise<NameRecord | null> {
        if (!isValidIotaName(name)) throw new Error('Invalid IOTA name');
        if (!this.config.registryTableId) throw new Error('IotaNames package ID is not set');

        const nameBcsB64 = toB64(
            NameBcs.serialize({
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
                    type: getNameType(this.config.packageId),
                    bcs: nameBcsB64,
                },
            },
        });

        const nameRecord = nameRecordResponse.data?.owner?.dynamicField?.value?.json;

        // in case the name record is not found, return null
        if (!nameRecord) return null;

        const nameRecordData = nameRecord.data?.contents;

        if (nameRecord.error || !nameRecordData)
            throw new Error('Name record not found. This name is not registered.');

        const data: Record<string, string> = {};

        if (nameRecordData) {
            nameRecordData.forEach((field: any) => {
                if (field.key) {
                    data[field.key as string] = field.value;
                }
            });
        }

        return {
            name,
            nftId: nameRecord?.nft_id,
            targetAddress: nameRecord?.target_address!,
            expirationTimestampMs: Number(nameRecord?.expiration_timestamp_ms),
            data,
            avatar: data[ALLOWED_METADATA.avatar],
        };
    }

    async getCouponHouse(): Promise<CouponHouse> {
        if (!this.config.iotaNamesObjectId) throw new Error('IotaNames object ID is not set');
        if (!this.config.packageId) throw new Error('IotaNames package ID is not set');
        if (!this.config.couponsPackageId) throw new Error('Coupon package ID is not set');

        const iotaNamesObjectId = this.config.iotaNamesObjectId;
        const packageId = this.config.packageId;
        const couponsPackageId = this.config.couponsPackageId;

        const DummyFieldB64 = DummyFieldBcs.serialize({ dummy_field: false }).toBase64();

        const couponHouseResponse = await this.graphQlClient.query<{
            owner: { dynamicField: { value: { bcs: string } } };
        }>({
            query: graphql(`
                query getIotaNamesCouponHouseRegistryKey(
                    $parentId: IotaAddress!
                    $name: DynamicFieldName!
                ) {
                    owner(address: $parentId) {
                        dynamicField(name: $name) {
                            value {
                                ... on MoveValue {
                                    bcs
                                }
                            }
                        }
                    }
                }
            `),
            variables: {
                parentId: iotaNamesObjectId,
                name: {
                    type: `${packageId}::iota_names::RegistryKey<${couponsPackageId}::coupon_house::CouponHouse>`,
                    bcs: DummyFieldB64,
                },
            },
        });

        const couponsHouseDynamicFieldBcsValue =
            couponHouseResponse?.data?.owner?.dynamicField?.value?.bcs;

        if (!couponsHouseDynamicFieldBcsValue) {
            throw new Error('Coupon house not found or is invalid');
        }

        return CouponHouseBcs.parse(fromB64(couponsHouseDynamicFieldBcsValue));
    }

    async resolveCoupon(couponCode: string): Promise<Coupon | null> {
        const couponHouse = await this.getCouponHouse();
        const couponsTableId = couponHouse?.coupons?.coupons?.id.id.bytes;

        if (!couponsTableId) {
            throw new Error('Coupons table ID not found in the coupon house');
        }

        const couponCodeHash = bytesToHex(blake2b(couponCode, { dkLen: 32 }));
        const couponCodeBytes = hexToBytes(couponCodeHash);

        const couponCodeB64 = bcs.vector(bcs.u8()).serialize(couponCodeBytes).toBase64();

        const couponResponse = await this.graphQlClient.query<{
            owner: { dynamicField: { value: { bcs: string } } };
        }>({
            query: graphql(`
                query getCouponBcs($parentId: IotaAddress!, $name: DynamicFieldName!) {
                    owner(address: $parentId) {
                        dynamicField(name: $name) {
                            value {
                                ... on MoveValue {
                                    bcs
                                }
                            }
                        }
                    }
                }
            `),
            variables: {
                parentId: couponsTableId,
                name: {
                    type: 'vector<u8>',
                    bcs: couponCodeB64,
                },
            },
        });

        const couponBcsBase64 = couponResponse?.data?.owner?.dynamicField?.value?.bcs;

        if (!couponBcsBase64) {
            return null;
        }

        const couponData = CouponBcs.parse(fromB64(couponBcsBase64));

        return { ...couponData, couponCode };
    }

    /**
     * Calculates the registration or renewal price for an SLN (Second Level Name).
     * It expects a name, the number of years and a `IotaNamesPriceList` object,
     * as returned from `iotaNamesClient.getPriceList()` function, or `iotaNames.getRenewalPriceList()` function.
     *
     * It throws an error:
     * 1. if the name is a subname
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

        if (isSubname(name)) {
            throw new Error('Subnames do not have a registration fee');
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

    async calculateDiscountedPrice({
        coupons,
        name,
        years,
        isRegistration = true,
        address,
    }: {
        coupons: Coupon[] | string[];
        name: string;
        years: number;
        isRegistration?: boolean;
        address?: string;
    }) {
        if (coupons.every((coupon) => typeof coupon === 'string')) {
            const couponPromises = (coupons as string[]).map(async (couponCode) => {
                const coupon = await this.resolveCoupon(couponCode);
                if (!coupon) {
                    throw new Error(`Coupon not found: ${couponCode}`);
                }

                return coupon;
            });

            coupons = (await Promise.all(couponPromises)) as Coupon[];
        }

        const normalizedName = normalizeIotaName(name, 'dot');

        validateIotaName(normalizedName);

        const nameParts = normalizedName.split('.');
        const firstNamePart = nameParts[0];

        validateCoupons(coupons, years, firstNamePart.length, address);

        const standardPrice = await this.calculatePrice({
            name,
            years,
            isRegistration,
        });

        return applyCouponsToPrice(coupons, standardPrice);
    }
}
