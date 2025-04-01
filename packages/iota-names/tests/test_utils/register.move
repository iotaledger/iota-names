// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module iota_names::register;

use std::string::String;
use iota::clock::Clock;
use iota::coin::Coin;
use iota_names::core_config::CoreConfig;
use iota_names::domain;
use iota_names::pricing_config::PricingConfig;
use iota_names::registry::Registry;
use iota_names::iota_names::{Self, IotaNames};
use iota_names::iota_names_registration::IotaNamesRegistration;

#[error]
const EInvalidYearsArgument: vector<u8> = b"Number of years passed is not within allowed interval.";
#[error]
const EIncorrectAmount: vector<u8> = b"The payment does not match the price for the domain.";

/// Authorization token for the app.
public struct Register has drop {}

// Allows direct purchases of domains
//
// Makes sure that:
// - the domain is not already registered (or, if active, expired)
// - the domain TLD is .iota
// - the domain is not a subdomain
// - number of years is within [1-5] interval
public fun register<T>(
    iota_names: &mut IotaNames,
    domain_name: String,
    no_years: u8,
    payment: Coin<T>,
    clock: &Clock,
    ctx: &mut TxContext,
): IotaNamesRegistration {
    iota_names.assert_app_is_authorized<Register>();

    let config = iota_names.get_config<PricingConfig>();
    // If no PricingConfig of type T, add an error code

    let domain = domain::new(domain_name);
    iota_names.get_config<CoreConfig>().assert_is_valid_for_sale(&domain);

    assert!(0 < no_years && no_years <= 5, EInvalidYearsArgument);

    let label = domain.sld();
    let price = config.calculate_base_price(label.length()) * (no_years as u64);
    assert!(payment.value() == price, EIncorrectAmount);

    iota_names.app_add_custom_balance<_, T>(Register {}, payment.into_balance());
    let registry = iota_names::app_registry_mut<Register, Registry>(
        Register {},
        iota_names,
    );
    registry.add_record(domain, no_years, clock, ctx)
}
