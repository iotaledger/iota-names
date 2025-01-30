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
module discounts::discounts;

use day_one::day_one::{DayOne, is_active};
use discounts::house::{Self, DiscountHouse};
use std::string::String;
use std::type_name as `type`;
use iota::clock::Clock;
use iota::coin::Coin;
use iota::dynamic_field as df;
use iota::iota::iota;
use iotans::domain;
use iotans::iotans::{Self, AdminCap, IotaNS};
use iotans::iotans_registration::IotansRegistration;

/// A configuration already exists
const EConfigExists: u64 = 1;
/// A configuration doesn't exist
const EConfigNotExists: u64 = 2;
/// Invalid payment value
const EIncorrectAmount: u64 = 3;
/// Tries to use DayOne on regular register flow.
const ENotValidForDayOne: u64 = 4;
/// Tries to claim with a non active DayOne
const ENotActiveDayOne: u64 = 5;

/// A key that opens up discounts for type T.
public struct DiscountKey<phantom T> has copy, store, drop {}

/// The Discount config for type T.
/// We save the sale price for each letter configuration (3 chars, 4 chars, 5+
/// chars)
public struct DiscountConfig has copy, store, drop {
    three_char_price: u64,
    four_char_price: u64,
    five_plus_char_price: u64,
}

/// A function to register a name with a discount using type `T`.
public fun register<T>(
    self: &mut DiscountHouse,
    iotans: &mut IotaNS,
    _: &T,
    domain_name: String,
    payment: Coin<IOTA>,
    clock: &Clock,
    _reseller: Option<String>,
    ctx: &mut TxContext,
): IotansRegistration {
    // For normal flow, we do not allow DayOne to be used.
    // DayOne can only be used on `register_with_day_one` function.
    assert!(
        `type`::into_string(`type`::get<T>()) != `type`::into_string(`type`::get<DayOne>()),
        ENotValidForDayOne,
    );
    internal_register_name<T>(self, iotans, domain_name, payment, clock, ctx)
}

/// A special function for DayOne registration.
/// We separate it from the normal registration flow because we only want it to
/// be usable
/// for activated DayOnes.
public fun register_with_day_one(
    self: &mut DiscountHouse,
    iotans: &mut IotaNS,
    day_one: &DayOne,
    domain_name: String,
    payment: Coin<IOTA>,
    clock: &Clock,
    _reseller: Option<String>,
    ctx: &mut TxContext,
): IotansRegistration {
    assert!(is_active(day_one), ENotActiveDayOne);
    internal_register_name<DayOne>(
        self,
        iotans,
        domain_name,
        payment,
        clock,
        ctx,
    )
}

/// Calculate the price of a label.
public fun calculate_price(self: &DiscountConfig, length: u8): u64 {
    let price = if (length == 3) {
        self.three_char_price
    } else if (length == 4) {
        self.four_char_price
    } else {
        self.five_plus_char_price
    };

    price
}

/// An admin action to authorize a type T for special pricing.
public fun authorize_type<T>(
    _: &AdminCap,
    self: &mut DiscountHouse,
    three_char_price: u64,
    four_char_price: u64,
    five_plus_char_price: u64,
) {
    self.assert_version_is_valid();
    assert!(
        !df::exists_(house::uid_mut(self), DiscountKey<T> {}),
        EConfigExists,
    );

    df::add(
        house::uid_mut(self),
        DiscountKey<T> {},
        DiscountConfig {
            three_char_price,
            four_char_price,
            five_plus_char_price,
        },
    );
}

/// An admin action to deauthorize type T from getting discounts.
public fun deauthorize_type<T>(_: &AdminCap, self: &mut DiscountHouse) {
    self.assert_version_is_valid();
    assert_config_exists<T>(self);
    df::remove<DiscountKey<T>, DiscountConfig>(
        self.uid_mut(),
        DiscountKey<T> {},
    );
}

/// Internal helper to handle the registration process
fun internal_register_name<T>(
    self: &mut DiscountHouse,
    iotans: &mut IotaNS,
    domain_name: String,
    payment: Coin<IOTA>,
    clock: &Clock,
    ctx: &mut TxContext,
): IotansRegistration {
    self.assert_version_is_valid();
    // validate that there's a configuration for type T.
    assert_config_exists<T>(self);

    let domain = domain::new(domain_name);
    let price = calculate_price(
        df::borrow(self.uid_mut(), DiscountKey<T> {}),
        (domain.sld().length() as u8),
    );

    assert!(payment.value() == price, EIncorrectAmount);
    iotans::app_add_balance(
        house::iotans_app_auth(),
        iotans,
        payment.into_balance(),
    );

    house::friend_add_registry_entry(iotans, domain, clock, ctx)
}

fun assert_config_exists<T>(self: &mut DiscountHouse) {
    assert!(
        df::exists_with_type<DiscountKey<T>, DiscountConfig>(
            house::uid_mut(self),
            DiscountKey<T> {},
        ),
        EConfigNotExists,
    );
}
