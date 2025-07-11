// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module iota_names::register;

use iota::clock::Clock;
use iota::coin::Coin;
use iota_names::core_config::CoreConfig;
use iota_names::name;
use iota_names::iota_names::{Self, IotaNames};
use iota_names::name_registration::NameRegistration;
use iota_names::pricing_config::PricingConfig;
use iota_names::registry::Registry;
use iota_names::validation;
use std::string::String;

#[error]
const EInvalidYearsArgument: vector<u8> = b"Number of years passed is not within allowed interval.";
#[error]
const EIncorrectAmount: vector<u8> = b"The payment does not match the price for the name.";

/// Authorization witness to call protected functions of `iota_names`.
public struct RegisterAuth has drop {}

// Allows direct purchases of names
//
// Makes sure that:
// - the name is not already registered (or, if active, expired)
// - the name TLN is .iota
// - the name is not a subname
// - number of years is within [1-5] interval
public fun register<T>(
    iota_names: &mut IotaNames,
    name: String,
    no_years: u8,
    payment: Coin<T>,
    clock: &Clock,
    ctx: &mut TxContext,
): NameRegistration {
    iota_names.assert_is_authorized<RegisterAuth>();

    let config = iota_names.get_config<PricingConfig>();
    // If no PricingConfig of type T, add an error code

    let name = name::new(name);
    validation::assert_is_valid_for_sale(iota_names.get_config<CoreConfig>(), iota_names, &name);

    assert!(0 < no_years && no_years <= 5, EInvalidYearsArgument);

    let price = config.calculate_base_price_of_name(name) * (no_years as u64);
    assert!(payment.value() == price, EIncorrectAmount);

    iota_names.auth_add_balance<_, T>(RegisterAuth {}, payment.into_balance());
    let registry = iota_names::auth_registry_mut<RegisterAuth, Registry>(
        RegisterAuth {},
        iota_names,
    );
    registry.add_record(name, no_years, clock, ctx)
}
