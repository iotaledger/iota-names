// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module iotans::register_sample;

use std::string::{Self, String};
use iota::clock::Clock;
use iota::coin::{Self, Coin};
use iota::iota::IOTA;
use iotans::config::{Self, Config};
use iotans::domain;
use iotans::registry::{Self, Registry};
use iotans::iotans::{Self, IOTANS};
use iotans::iotans_registration::IotansRegistration;

/// Number of years passed is not within [1-5] interval.
const EInvalidYearsArgument: u64 = 0;
/// Trying to register a subdomain (only *.iota is currently allowed).
/// The payment does not match the price for the domain.
const EIncorrectAmount: u64 = 4;

/// Authorization token for the app.
public struct Register has drop {}

// Allows direct purchases of domains
//
// Makes sure that:
// - the domain is not already registered (or, if active, expired)
// - the domain TLD is .iota
// - the domain is not a subdomain
// - number of years is within [1-5] interval
public fun register(
    iotans: &mut IOTANS,
    domain_name: String,
    no_years: u8,
    payment: Coin<IOTA>,
    clock: &Clock,
    ctx: &mut TxContext,
): IotansRegistration {
    iotans::assert_app_is_authorized<Register>(iotans);

    let config = iotans::get_config<Config>(iotans);

    let domain = domain::new(domain_name);
    config::assert_valid_user_registerable_domain(&domain);

    assert!(0 < no_years && no_years <= 5, EInvalidYearsArgument);

    let label = domain::sld(&domain);
    let price = config::calculate_price(
        config,
        (string::length(label) as u8),
        no_years,
    );

    assert!(coin::value(&payment) == price, EIncorrectAmount);

    iotans::app_add_balance(Register {}, iotans, coin::into_balance(payment));
    let registry = iotans::app_registry_mut<Register, Registry>(
        Register {},
        iotans,
    );
    registry::add_record(registry, domain, no_years, clock, ctx)
}
