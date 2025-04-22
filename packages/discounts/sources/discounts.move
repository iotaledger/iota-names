// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// A module that allows purchasing names in a different price by presenting a
/// reference of type T.
/// Each `T` can have a separate configuration for a discount percentage.
/// If a `T` doesn't exist, registration will fail.
///
/// Can be called only when promotions are active for a specific type T.
/// Activation / deactivation happens through PTBs.
module iota_names_discounts::discounts;

use iota::dynamic_field as df;
use iota_names::{
    iota_names::{AdminCap, IotaNames},
    payment::PaymentIntent,
    pricing_config::PricingConfig
};
use iota_names_discounts::house::{Self, DiscountHouse};

use fun internal_apply_discount as DiscountHouse.internal_apply_discount;
use fun assert_config_exists as DiscountHouse.assert_config_exists;
use fun config as DiscountHouse.config;
use fun df::add as UID.add;
use fun df::exists_with_type as UID.exists_with_type;
use fun df::exists_ as UID.exists_;
use fun df::borrow as UID.borrow;

#[error]
const EConfigAlreadyExists: vector<u8> = b"Config already exists";
#[error]
const EConfigNotExists: vector<u8> = b"Config does not exist";
#[error]
const EIncorrectAmount: vector<u8> = b"Incorrect amount";

/// A key allowing DiscountHouse to apply discounts.
public struct RegularDiscountsApp() has drop;

/// A key that determines the discounts for a type `T`.
public struct DiscountKey<phantom T>() has copy, drop, store;

/// A function to register a name with a discount using type `T`.
public fun apply_percentage_discount<T>(
    self: &mut DiscountHouse,
    intent: &mut PaymentIntent,
    iota_names: &mut IotaNames,
    _: &mut T, // proof of owning the type T mutably.
    ctx: &mut TxContext,
) {
    self.internal_apply_discount<T>(intent, iota_names, ctx);
}

/// An admin action to authorize a type T for special pricing.
///
/// When authorizing, we reuse the core `PricingConfig` struct,
/// and only accept it if all the values are in the [0, 100] range.
/// make sure that all the percentages are in the [0, 99] range.
/// We can use `free_claims` to giveaway free names.
public fun authorize_type<T>(
    self: &mut DiscountHouse,
    _: &AdminCap,
    pricing_config: PricingConfig,
) {
    assert!(!self.uid_mut().exists_(DiscountKey<T>()), EConfigAlreadyExists);
    let (_, values) = (*pricing_config.pricing()).into_keys_values();

    assert!(!values.any!(|percentage| *percentage > 99), EIncorrectAmount);

    self.uid_mut().add(DiscountKey<T>(), pricing_config);
}

/// An admin action to deauthorize type T from getting discounts.
public fun deauthorize_type<T>(_: &AdminCap, self: &mut DiscountHouse) {
    self.assert_version_is_valid();
    self.assert_config_exists<T>();
    df::remove<_, PricingConfig>(
        self.uid_mut(),
        DiscountKey<T>(),
    );
}

fun internal_apply_discount<T>(
    self: &mut DiscountHouse,
    intent: &mut PaymentIntent,
    iota_names: &mut IotaNames,
    _ctx: &mut TxContext,
) {
    let config = self.config<T>();

    let discount_percent = config.calculate_base_price(intent
        .request_data()
        .domain()
        .sld()
        .length());

    intent.apply_percentage_discount(
        iota_names,
        RegularDiscountsApp(),
        house::discount_house_key!(),
        // SAFETY: We know that the discount percentage is in the [0, 99] range.
        discount_percent as u8,
        false,
    );
}

fun config<T>(self: &mut DiscountHouse): &PricingConfig {
    self.assert_config_exists<T>();
    self.uid_mut().borrow<_, PricingConfig>(DiscountKey<T>())
}

fun assert_config_exists<T>(self: &mut DiscountHouse) {
    assert!(self.uid_mut().exists_with_type<_, PricingConfig>(DiscountKey<T>()), EConfigNotExists);
}
