// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@iota/iota-sdk/bcs';
import type {
    Transaction,
    TransactionObjectArgument,
    TransactionObjectInput,
} from '@iota/iota-sdk/transactions';
import { IOTA_CLOCK_OBJECT_ID } from '@iota/iota-sdk/utils';

import { ALLOWED_METADATA } from './constants.js';
import { isNestedSubname, isSubname } from './helpers.js';
import type { IotaNamesClient } from './iota-names-client.js';
import type { ReceiptParams, RegistrationParams, RenewalParams } from './types.js';
import { isValidIotaName, normalizeIotaName } from './utils.js';

export class IotaNamesTransaction {
    iotaNamesClient: IotaNamesClient;
    transaction: Transaction;

    constructor(client: IotaNamesClient, transaction: Transaction) {
        this.iotaNamesClient = client;
        this.transaction = transaction;
    }

    /**
     * Registers a name.
     */
    async register(params: RegistrationParams): Promise<TransactionObjectArgument> {
        const paymentIntent = this.initRegistration(params.name);

        const couponCodes = params.couponCodes;
        let discountedPrice: number | null = null;

        if (couponCodes && couponCodes.length > 0) {
            discountedPrice = await this.iotaNamesClient.calculateDiscountedPrice({
                coupons: couponCodes,
                name: params.name,
                years: 1,
                isRegistration: true,
                address: params.address,
            });

            for (const couponCode of couponCodes) {
                this.applyCoupon(couponCode, paymentIntent);
            }
        }

        const amounts = [discountedPrice ?? this.getBasePrice(paymentIntent)];
        const payment = this.transaction.splitCoins(this.transaction.object(params.coin), amounts);

        const receipt = this.generateReceipt({
            paymentIntent,
            payment,
            coinConfig: params.coinConfig || this.iotaNamesClient.config.coins.IOTA,
        });

        return this.finalizeRegister(receipt);
    }

    /**
     * Renews an NFT for a number of years.
     */
    async renew(params: RenewalParams): Promise<void> {
        const paymentIntent = this.initRenewal(params.nft, params.years);

        const couponCodes = params.couponCodes;
        let discountedPrice: number | null = null;

        if (couponCodes && couponCodes.length > 0) {
            discountedPrice = await this.iotaNamesClient.calculateDiscountedPrice({
                coupons: couponCodes,
                name: params.name,
                years: params.years,
                isRegistration: false,
                address: params.address,
            });

            for (const couponCode of couponCodes) {
                this.applyCoupon(couponCode, paymentIntent);
            }
        }

        const amounts = [discountedPrice ?? this.getBasePrice(paymentIntent)];
        const payment = this.transaction.splitCoins(this.transaction.object(params.coin), amounts);

        const receipt = this.generateReceipt({
            paymentIntent,
            payment,
            coinConfig: params.coinConfig || this.iotaNamesClient.config.coins.IOTA,
        });
        this.finalizeRenew(receipt, params.nft);
    }

    initRegistration(name: string): TransactionObjectArgument {
        const config = this.iotaNamesClient.config;
        return this.transaction.moveCall({
            target: `${config.packageId}::payment::init_registration`,
            arguments: [
                this.transaction.object(config.iotaNamesObjectId),
                this.transaction.pure.string(name),
            ],
        });
    }

    initRenewal(nft: TransactionObjectInput, years: number): TransactionObjectArgument {
        const config = this.iotaNamesClient.config;
        return this.transaction.moveCall({
            target: `${config.packageId}::payment::init_renewal`,
            arguments: [
                this.transaction.object(config.iotaNamesObjectId),
                this.transaction.object(nft),
                this.transaction.pure.u8(years),
            ],
        });
    }

    handleBasePayment(
        paymentIntent: TransactionObjectArgument,
        payment: TransactionObjectArgument,
        paymentType: string,
    ): TransactionObjectArgument {
        const config = this.iotaNamesClient.config;
        return this.transaction.moveCall({
            target: `${config.paymentsPackageId}::payments::handle_base_payment`,
            arguments: [this.transaction.object(config.iotaNamesObjectId), paymentIntent, payment],
            typeArguments: [paymentType],
        });
    }

    finalizeRegister(receipt: TransactionObjectArgument): TransactionObjectArgument {
        const config = this.iotaNamesClient.config;
        return this.transaction.moveCall({
            target: `${config.packageId}::payment::register`,
            arguments: [
                receipt,
                this.transaction.object(config.iotaNamesObjectId),
                this.transaction.object.clock(),
            ],
        });
    }

    finalizeRenew(
        receipt: TransactionObjectArgument,
        nft: TransactionObjectInput,
    ): TransactionObjectArgument {
        const config = this.iotaNamesClient.config;
        return this.transaction.moveCall({
            target: `${config.packageId}::payment::renew`,
            arguments: [
                receipt,
                this.transaction.object(config.iotaNamesObjectId),
                this.transaction.object(nft),
                this.transaction.object.clock(),
            ],
        });
    }

    getBasePrice(paymentIntent: TransactionObjectArgument): TransactionObjectArgument {
        const config = this.iotaNamesClient.config;
        return this.transaction.moveCall({
            target: `${config.packageId}::payment::request_base_amount`,
            arguments: [paymentIntent],
        });
    }

    applyCoupon(couponCode: string, paymentIntent: TransactionObjectArgument) {
        const config = this.iotaNamesClient.config;
        return this.transaction.moveCall({
            target: `${config.couponsPackageId}::coupon_house::apply_coupon`,
            arguments: [
                paymentIntent,
                this.transaction.object(config.iotaNamesObjectId),
                this.transaction.pure.string(couponCode),
                this.transaction.object(IOTA_CLOCK_OBJECT_ID),
            ],
        });
    }

    generateReceipt(params: ReceiptParams): TransactionObjectArgument {
        const receipt = this.handleBasePayment(
            params.paymentIntent,
            params.payment,
            params.coinConfig.type,
        );
        return receipt;
    }

    /**
     * Creates a subname.
     */
    createSubname({
        parentNft,
        name,
        expirationTimestampMs,
        allowChildCreation,
        allowTimeExtension,
    }: {
        parentNft: TransactionObjectInput;
        name: string;
        expirationTimestampMs: number;
        allowChildCreation: boolean;
        allowTimeExtension: boolean;
    }) {
        if (!isValidIotaName(name)) throw new Error('Invalid IOTA names');
        const isParentSubname = isNestedSubname(name);
        if (!this.iotaNamesClient.config.iotaNamesObjectId)
            throw new Error('IotaNames Object ID not found');
        if (!this.iotaNamesClient.config.subnamesPackageId)
            throw new Error('Subnames package ID not found');
        if (isParentSubname && !this.iotaNamesClient.config.tempSubnameProxyPackageId)
            throw new Error('Subnames proxy package ID not found');

        const subNft = this.transaction.moveCall({
            target: isParentSubname
                ? `${this.iotaNamesClient.config.tempSubnameProxyPackageId}::subname_proxy::new`
                : `${this.iotaNamesClient.config.subnamesPackageId}::subnames::new`,
            arguments: [
                this.transaction.object(this.iotaNamesClient.config.iotaNamesObjectId),
                this.transaction.object(parentNft),
                this.transaction.object(IOTA_CLOCK_OBJECT_ID),
                this.transaction.pure.string(normalizeIotaName(name, 'dot')),
                this.transaction.pure.u64(expirationTimestampMs),
                this.transaction.pure.bool(!!allowChildCreation),
                this.transaction.pure.bool(!!allowTimeExtension),
            ],
        });

        return subNft;
    }

    /**
     * Builds the PTB to create a leaf subname.
     * Parent can be a `NameRegistration` or a `SubnameRegistration` object.
     * Can be passed in as an ID or a TransactionArgument.
     */
    createLeafSubname({
        parentNft,
        name,
        targetAddress,
    }: {
        parentNft: TransactionObjectInput;
        name: string;
        targetAddress: string;
    }) {
        if (!isValidIotaName(name)) throw new Error('Invalid IOTA names');
        const isParentSubname = isNestedSubname(name);
        if (!this.iotaNamesClient.config.iotaNamesObjectId)
            throw new Error('IOTA-Names Object ID not found');
        if (!this.iotaNamesClient.config.subnamesPackageId)
            throw new Error('Subnames package ID not found');
        if (isParentSubname && !this.iotaNamesClient.config.tempSubnameProxyPackageId)
            throw new Error('Subnames proxy package ID not found');

        this.transaction.moveCall({
            target: isParentSubname
                ? `${this.iotaNamesClient.config.tempSubnameProxyPackageId}::subname_proxy::new_leaf`
                : `${this.iotaNamesClient.config.subnamesPackageId}::subnames::new_leaf`,
            arguments: [
                this.transaction.object(this.iotaNamesClient.config.iotaNamesObjectId),
                this.transaction.object(parentNft),
                this.transaction.object(IOTA_CLOCK_OBJECT_ID),
                this.transaction.pure.string(normalizeIotaName(name, 'dot')),
                this.transaction.pure.address(targetAddress),
            ],
        });
    }

    /**
     * Removes a leaf subname.
     */
    removeLeafSubname({ parentNft, name }: { parentNft: TransactionObjectInput; name: string }) {
        if (!isValidIotaName(name)) throw new Error('Invalid IOTA names');
        const isParentSubname = isNestedSubname(name);
        if (!isSubname(name)) throw new Error('This can only be invoked for subnames');
        if (!this.iotaNamesClient.config.iotaNamesObjectId)
            throw new Error('IOTA-Names Object ID not found');
        if (!this.iotaNamesClient.config.subnamesPackageId)
            throw new Error('Subnames package ID not found');
        if (isParentSubname && !this.iotaNamesClient.config.tempSubnameProxyPackageId)
            throw new Error('Subnames proxy package ID not found');

        this.transaction.moveCall({
            target: isParentSubname
                ? `${this.iotaNamesClient.config.tempSubnameProxyPackageId}::subname_proxy::remove_leaf`
                : `${this.iotaNamesClient.config.subnamesPackageId}::subnames::remove_leaf`,
            arguments: [
                this.transaction.object(this.iotaNamesClient.config.iotaNamesObjectId),
                this.transaction.object(parentNft),
                this.transaction.object(IOTA_CLOCK_OBJECT_ID),
                this.transaction.pure.string(normalizeIotaName(name, 'dot')),
            ],
        });
    }

    /**
     * Sets the target address of an NFT.
     */
    setTargetAddress({
        nft, // Can be string or argument
        address,
        isSubname,
    }: {
        nft: TransactionObjectInput;
        address?: string;
        isSubname?: boolean;
    }) {
        if (isSubname && !this.iotaNamesClient.config.tempSubnameProxyPackageId)
            throw new Error('Subnames proxy package ID not found');

        this.transaction.moveCall({
            target: isSubname
                ? `${this.iotaNamesClient.config.tempSubnameProxyPackageId}::subname_proxy::set_target_address`
                : `${this.iotaNamesClient.config.packageId}::controller::set_target_address`,
            arguments: [
                this.transaction.object(this.iotaNamesClient.config.iotaNamesObjectId),
                this.transaction.object(nft),
                this.transaction.pure(bcs.option(bcs.Address).serialize(address).toBytes()),
                this.transaction.object(IOTA_CLOCK_OBJECT_ID),
            ],
        });
    }

    /**
     * Sets a default name for the user.
     */
    setDefault(name: string) {
        if (!isValidIotaName(name)) throw new Error('Invalid IOTA names');
        if (!this.iotaNamesClient.config.iotaNamesObjectId)
            throw new Error('IOTA-Names Object ID not found');

        this.transaction.moveCall({
            target: `${this.iotaNamesClient.config.packageId}::controller::set_reverse_lookup`,
            arguments: [
                this.transaction.object(this.iotaNamesClient.config.iotaNamesObjectId),
                this.transaction.pure.string(normalizeIotaName(name, 'dot')),
            ],
        });
    }

    /**
     * Unsets a default name for the user.
     */
    unsetDefault() {
        if (!this.iotaNamesClient.config.iotaNamesObjectId)
            throw new Error('IOTA-Names Object ID not found');

        this.transaction.moveCall({
            target: `${this.iotaNamesClient.config.packageId}::controller::unset_reverse_lookup`,
            arguments: [this.transaction.object(this.iotaNamesClient.config.iotaNamesObjectId)],
        });
    }

    /**
     * Edits the setup of a subname.
     */
    editSetup({
        parentNft,
        name,
        allowChildCreation,
        allowTimeExtension,
    }: {
        parentNft: TransactionObjectInput;
        name: string;
        allowChildCreation: boolean;
        allowTimeExtension: boolean;
    }) {
        if (!isValidIotaName(name)) throw new Error('Invalid IOTA names');
        const isParentSubname = isNestedSubname(name);
        if (!this.iotaNamesClient.config.iotaNamesObjectId)
            throw new Error('IOTA-Names Object ID not found');
        if (!isParentSubname && !this.iotaNamesClient.config.subnamesPackageId)
            throw new Error('Subnames package ID not found');
        if (isParentSubname && !this.iotaNamesClient.config.tempSubnameProxyPackageId)
            throw new Error('Subnames proxy package ID not found');

        this.transaction.moveCall({
            target: isParentSubname
                ? `${this.iotaNamesClient.config.tempSubnameProxyPackageId}::subname_proxy::edit_setup`
                : `${this.iotaNamesClient.config.subnamesPackageId}::subnames::edit_setup`,
            arguments: [
                this.transaction.object(this.iotaNamesClient.config.iotaNamesObjectId),
                this.transaction.object(parentNft),
                this.transaction.object(IOTA_CLOCK_OBJECT_ID),
                this.transaction.pure.string(normalizeIotaName(name, 'dot')),
                this.transaction.pure.bool(!!allowChildCreation),
                this.transaction.pure.bool(!!allowTimeExtension),
            ],
        });
    }

    /**
     * Extends the expiration of a subname.
     */
    extendExpiration({
        nft,
        expirationTimestampMs,
    }: {
        nft: TransactionObjectInput;
        expirationTimestampMs: number;
    }) {
        if (!this.iotaNamesClient.config.iotaNamesObjectId)
            throw new Error('IOTA-Names Object ID not found');
        if (!this.iotaNamesClient.config.subnamesPackageId)
            throw new Error('Subnames package ID not found');

        this.transaction.moveCall({
            target: `${this.iotaNamesClient.config.subnamesPackageId}::subnames::extend_expiration`,
            arguments: [
                this.transaction.object(this.iotaNamesClient.config.iotaNamesObjectId),
                this.transaction.object(nft),
                this.transaction.pure.u64(expirationTimestampMs),
            ],
        });
    }

    /**
     * Sets the user data of an NFT.
     */
    setUserData({
        nft,
        value,
        key,
        isSubname,
    }: {
        nft: TransactionObjectInput;
        value: string;
        key: string;
        isSubname?: boolean;
    }) {
        if (!this.iotaNamesClient.config.iotaNamesObjectId)
            throw new Error('IOTA-Names Object ID not found');
        if (isSubname && !this.iotaNamesClient.config.tempSubnameProxyPackageId)
            throw new Error('Subnames proxy package ID not found');

        if (!Object.values(ALLOWED_METADATA).some((x) => x === key)) throw new Error('Invalid key');

        this.transaction.moveCall({
            target: isSubname
                ? `${this.iotaNamesClient.config.tempSubnameProxyPackageId}::subname_proxy::set_user_data`
                : `${this.iotaNamesClient.config.packageId}::controller::set_user_data`,
            arguments: [
                this.transaction.object(this.iotaNamesClient.config.iotaNamesObjectId),
                this.transaction.object(nft),
                this.transaction.pure.string(key),
                this.transaction.pure.string(value),
                this.transaction.object(IOTA_CLOCK_OBJECT_ID),
            ],
        });
    }

    /**
     * Unsets the user data of an NFT.
     */
    unsetUserData({
        nft,
        key,
        isSubname,
    }: {
        nft: TransactionObjectInput;
        key: string;
        isSubname?: boolean;
    }) {
        if (!this.iotaNamesClient.config.iotaNamesObjectId)
            throw new Error('IOTA-Names Object ID not found');
        if (isSubname && !this.iotaNamesClient.config.tempSubnameProxyPackageId)
            throw new Error('Subnames proxy package ID not found');

        if (!Object.values(ALLOWED_METADATA).some((x) => x === key)) throw new Error('Invalid key');

        this.transaction.moveCall({
            target: isSubname
                ? `${this.iotaNamesClient.config.tempSubnameProxyPackageId}::subname_proxy::unset_user_data`
                : `${this.iotaNamesClient.config.packageId}::controller::unset_user_data`,
            arguments: [
                this.transaction.object(this.iotaNamesClient.config.iotaNamesObjectId),
                this.transaction.object(nft),
                this.transaction.pure.string(key),
                this.transaction.object(IOTA_CLOCK_OBJECT_ID),
            ],
        });
    }

    /**
     * Burns an expired NFT to collect storage rebates.
     */
    burnExpired({ nft, isSubname }: { nft: TransactionObjectInput; isSubname?: boolean }) {
        if (!this.iotaNamesClient.config.iotaNamesObjectId)
            throw new Error('IOTA-Names Object ID not found');

        this.transaction.moveCall({
            target: `${this.iotaNamesClient.config.packageId}::controller::${
                isSubname ? 'burn_expired_subname' : 'burn_expired'
            }`, // Update this
            arguments: [
                this.transaction.object(this.iotaNamesClient.config.iotaNamesObjectId),
                this.transaction.object(nft),
                this.transaction.object(IOTA_CLOCK_OBJECT_ID),
            ],
        });
    }
}
