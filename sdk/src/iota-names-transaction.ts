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

import { ALLOWED_METADATA } from './constants';
import { isNestedSubName, isSubName } from './helpers';
import type { IotaNamesClient } from './iota-names-client';
import type { ReceiptParams, RegistrationParams, RenewalParams } from './types';
import { isValidIotaName, normalizeIotaName } from './utils';

export class IotaNamesTransaction {
    iotaNamesClient: IotaNamesClient;
    transaction: Transaction;

    constructor(client: IotaNamesClient, transaction: Transaction) {
        this.iotaNamesClient = client;
        this.transaction = transaction;
    }

    /**
     * Registers a domain for a number of years.
     */
    register(params: RegistrationParams): TransactionObjectArgument {
        const paymentIntent = this.initRegistration(params.domain);
        let price = this.getBasePrice(paymentIntent);
        const receipt = this.generateReceipt({
            paymentIntent,
            price,
            coinConfig: params.coinConfig || this.iotaNamesClient.config.coins.IOTA,
            coin: params.coin,
        });
        const nft = this.finalizeRegister(receipt);

        if (params.years > 1) {
            this.renew({
                nft,
                years: params.years - 1,
                coinConfig: params.coinConfig,
                coin: params.coin,
            });
        }

        return nft as TransactionObjectArgument;
    }

    /**
     * Renews an NFT for a number of years.
     */
    renew(params: RenewalParams): void {
        const paymentIntent = this.initRenewal(params.nft, params.years);
        let price = this.getBasePrice(paymentIntent);
        const receipt = this.generateReceipt({
            paymentIntent,
            price,
            coinConfig: params.coinConfig || this.iotaNamesClient.config.coins.IOTA,
            coin: params.coin,
        });
        this.finalizeRenew(receipt, params.nft);
    }

    initRegistration(domain: string): TransactionObjectArgument {
        const config = this.iotaNamesClient.config;
        return this.transaction.moveCall({
            target: `${config.packageId}::payment::init_registration`,
            arguments: [
                this.transaction.object(config.iotaNames),
                this.transaction.pure.string(domain),
            ],
        });
    }

    initRenewal(nft: TransactionObjectInput, years: number): TransactionObjectArgument {
        const config = this.iotaNamesClient.config;
        return this.transaction.moveCall({
            target: `${config.packageId}::payment::init_renewal`,
            arguments: [
                this.transaction.object(config.iotaNames),
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
            target: `${config.payments.packageId}::payments::handle_base_payment`,
            arguments: [this.transaction.object(config.iotaNames), paymentIntent, payment],
            typeArguments: [paymentType],
        });
    }

    finalizeRegister(receipt: TransactionObjectArgument): TransactionObjectArgument {
        const config = this.iotaNamesClient.config;
        return this.transaction.moveCall({
            target: `${config.packageId}::payment::register`,
            arguments: [
                receipt,
                this.transaction.object(config.iotaNames),
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
                this.transaction.object(config.iotaNames),
                this.transaction.object(nft),
                this.transaction.object.clock(),
            ],
        });
    }

    getBasePrice(paymentIntent: TransactionObjectArgument): TransactionObjectArgument {
        const config = this.iotaNamesClient.config;
        return this.transaction.moveCall({
            target: `${config.packageId}::payments::request_base_amount`,
            arguments: [paymentIntent],
        });
    }

    generateReceipt(params: ReceiptParams): TransactionObjectArgument {
        const payment = this.transaction.splitCoins(this.transaction.object(params.coin), [
            params.price,
        ]);
        const receipt = this.handleBasePayment(
            params.paymentIntent,
            payment,
            params.coinConfig.type,
        );
        return receipt;
    }

    /**
     * Creates a subdomain.
     */
    createSubName({
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
        const isParentSubdomain = isNestedSubName(name);
        if (!this.iotaNamesClient.config.iotaNames)
            throw new Error('IotaNames Object ID not found');
        if (!this.iotaNamesClient.config.subNamesPackageId)
            throw new Error('Subnames package ID not found');
        if (isParentSubdomain && !this.iotaNamesClient.config.tempSubdomainsProxyPackageId)
            throw new Error('Subnames proxy package ID not found');

        const subNft = this.transaction.moveCall({
            target: isParentSubdomain
                ? `${this.iotaNamesClient.config.tempSubdomainsProxyPackageId}::subdomain_proxy::new`
                : `${this.iotaNamesClient.config.subNamesPackageId}::subdomains::new`,
            arguments: [
                this.transaction.object(this.iotaNamesClient.config.iotaNames),
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
     * Builds the PTB to create a leaf subdomain.
     * Parent can be a `IotaNamesRegistration` or a `SubdomainRegistration` object.
     * Can be passed in as an ID or a TransactionArgument.
     */
    createLeafSubName({
        parentNft,
        name,
        targetAddress,
    }: {
        parentNft: TransactionObjectInput;
        name: string;
        targetAddress: string;
    }) {
        if (!isValidIotaName(name)) throw new Error('Invalid IOTA names');
        const isParentSubdomain = isNestedSubName(name);
        if (!this.iotaNamesClient.config.iotaNames)
            throw new Error('IOTA-Names Object ID not found');
        if (!this.iotaNamesClient.config.subNamesPackageId)
            throw new Error('Subnames package ID not found');
        if (isParentSubdomain && !this.iotaNamesClient.config.tempSubdomainsProxyPackageId)
            throw new Error('Subnames proxy package ID not found');

        this.transaction.moveCall({
            target: isParentSubdomain
                ? `${this.iotaNamesClient.config.tempSubdomainsProxyPackageId}::subdomain_proxy::new_leaf`
                : `${this.iotaNamesClient.config.subNamesPackageId}::subdomains::new_leaf`,
            arguments: [
                this.transaction.object(this.iotaNamesClient.config.iotaNames),
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
    removeLeafSubName({ parentNft, name }: { parentNft: TransactionObjectInput; name: string }) {
        if (!isValidIotaName(name)) throw new Error('Invalid IOTA names');
        const isParentSubdomain = isNestedSubName(name);
        if (!isSubName(name)) throw new Error('This can only be invoked for subnames');
        if (!this.iotaNamesClient.config.iotaNames)
            throw new Error('IOTA-Names Object ID not found');
        if (!this.iotaNamesClient.config.subNamesPackageId)
            throw new Error('Subnames package ID not found');
        if (isParentSubdomain && !this.iotaNamesClient.config.tempSubdomainsProxyPackageId)
            throw new Error('Subnames proxy package ID not found');

        this.transaction.moveCall({
            target: isParentSubdomain
                ? `${this.iotaNamesClient.config.tempSubdomainsProxyPackageId}::subdomain_proxy::remove_leaf`
                : `${this.iotaNamesClient.config.subNamesPackageId}::subdomains::remove_leaf`,
            arguments: [
                this.transaction.object(this.iotaNamesClient.config.iotaNames),
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
        if (isSubname && !this.iotaNamesClient.config.tempSubdomainsProxyPackageId)
            throw new Error('Subnames proxy package ID not found');

        this.transaction.moveCall({
            target: isSubname
                ? `${this.iotaNamesClient.config.tempSubdomainsProxyPackageId}::subdomain_proxy::set_target_address`
                : `${this.iotaNamesClient.config.packageId}::controller::set_target_address`,
            arguments: [
                this.transaction.object(this.iotaNamesClient.config.iotaNames),
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
        if (!this.iotaNamesClient.config.iotaNames)
            throw new Error('IOTA-Names Object ID not found');

        this.transaction.moveCall({
            target: `${this.iotaNamesClient.config.packageId}::controller::set_reverse_lookup`,
            arguments: [
                this.transaction.object(this.iotaNamesClient.config.iotaNames),
                this.transaction.pure.string(normalizeIotaName(name, 'dot')),
            ],
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
        const isParentSubdomain = isNestedSubName(name);
        if (!this.iotaNamesClient.config.iotaNames)
            throw new Error('IOTA-Names Object ID not found');
        if (!isParentSubdomain && !this.iotaNamesClient.config.subNamesPackageId)
            throw new Error('Subnames package ID not found');
        if (isParentSubdomain && !this.iotaNamesClient.config.tempSubdomainsProxyPackageId)
            throw new Error('Subnames proxy package ID not found');

        this.transaction.moveCall({
            target: isParentSubdomain
                ? `${this.iotaNamesClient.config.tempSubdomainsProxyPackageId}::subdomain_proxy::edit_setup`
                : `${this.iotaNamesClient.config.subNamesPackageId}::subdomains::edit_setup`,
            arguments: [
                this.transaction.object(this.iotaNamesClient.config.iotaNames),
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
        if (!this.iotaNamesClient.config.iotaNames)
            throw new Error('IOTA-Names Object ID not found');
        if (!this.iotaNamesClient.config.subNamesPackageId)
            throw new Error('Subnames package ID not found');

        this.transaction.moveCall({
            target: `${this.iotaNamesClient.config.subNamesPackageId}::subdomains::extend_expiration`,
            arguments: [
                this.transaction.object(this.iotaNamesClient.config.iotaNames),
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
        if (!this.iotaNamesClient.config.iotaNames)
            throw new Error('IOTA-Names Object ID not found');
        if (isSubname && !this.iotaNamesClient.config.tempSubdomainsProxyPackageId)
            throw new Error('Subnames proxy package ID not found');

        if (!Object.values(ALLOWED_METADATA).some((x) => x === key)) throw new Error('Invalid key');

        this.transaction.moveCall({
            target: isSubname
                ? `${this.iotaNamesClient.config.tempSubdomainsProxyPackageId}::subdomain_proxy::set_user_data`
                : `${this.iotaNamesClient.config.packageId}::controller::set_user_data`,
            arguments: [
                this.transaction.object(this.iotaNamesClient.config.iotaNames),
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
    burnExpired({ nft, isSubname }: { nft: TransactionObjectInput; isSubname?: boolean }) {
        if (!this.iotaNamesClient.config.iotaNames)
            throw new Error('IOTA-Names Object ID not found');

        this.transaction.moveCall({
            target: `${this.iotaNamesClient.config.packageId}::controller::${
                isSubname ? 'burn_expired_subname' : 'burn_expired'
            }`, // Update this
            arguments: [
                this.transaction.object(this.iotaNamesClient.config.iotaNames),
                this.transaction.object(nft),
                this.transaction.object(IOTA_CLOCK_OBJECT_ID),
            ],
        });
    }
}
