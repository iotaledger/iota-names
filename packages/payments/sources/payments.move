// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

module payments::payments;

use iota::coin::{Coin, CoinMetadata};
use iota::vec_map::{Self, VecMap};
use iota_names::iota_names::IotaNames;
use iota_names::payment::{Receipt, PaymentIntent};
use std::type_name::{Self, TypeName};

/// Authorization witness to call protected functions of `iota_names`.
public struct PaymentsAuth has drop {}

#[error]
const EBaseCurrencySetupMissing: vector<u8> = b"Setup for the base currency is missing.";
#[error]
const EInsufficientPayment: vector<u8> = b"Insufficient coin balance.";
#[error]
const EInvalidPaymentType: vector<u8> = b"The supplied payment coin type is not supported.";

/// Configuration for the payments module.
/// Holds a VecMap that determines the configuration for each currency.
public struct PaymentsConfig has drop, store {
    // the configuration for each currency.
    currencies: VecMap<TypeName, CoinTypeData>,
    // the type of our base currency (which determines the base price unit).
    base_currency: TypeName,
}

public struct CoinTypeData has copy, drop, store {
    /// The coin's decimals.
    decimals: u8,
    // type
    type_name: TypeName,
}

/// This has to be called with our base payment currency.
/// The payment has to be equal to the base price of the domain.
/// We do not need to check the price feed for the base currency.
public fun handle_base_payment<T>(
    iota_names: &mut IotaNames,
    intent: PaymentIntent,
    payment: Coin<T>,
): Receipt {
    let payment_type = type_name::get<T>();
    let config = iota_names.get_config<PaymentsConfig>();

    assert!(payment_type == config.base_currency, EInvalidPaymentType);

    let price = intent.request_data().base_amount();
    assert!(payment.value() == price, EInsufficientPayment);

    intent.finalize_payment(iota_names, PaymentsAuth {}, payment)
}

/// Creates a new CoinTypeData struct.
/// Leave price_feed_id empty for base currency.
public fun new_coin_type_data<T>(coin_metadata: &CoinMetadata<T>): CoinTypeData {
    let type_name = type_name::get<T>();
    CoinTypeData {
        decimals: coin_metadata.get_decimals(),
        type_name,
    }
}

/// Creates a new PaymentsConfig struct.
/// Can be attached by the Admin to IotaNames to allow the payments module to work.
public fun new_payments_config(
    setups: vector<CoinTypeData>,
    base_currency: TypeName,
): PaymentsConfig {
    let mut currencies: VecMap<TypeName, CoinTypeData> = vec_map::empty();

    setups.do!(|coin_type| {
        currencies.insert(coin_type.type_name, coin_type);
    });

    assert!(currencies.contains(&base_currency), EBaseCurrencySetupMissing);

    PaymentsConfig {
        currencies,
        base_currency,
    }
}
