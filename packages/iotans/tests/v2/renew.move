// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module iotans::renew;

use std::string;
use iota::clock::{timestamp_ms, Clock};
use iota::coin::{Self, Coin};
use iota::iota::IOTA;
use iotans::config::{Self, Config};
use iotans::constants;
use iotans::domain;
use iotans::name_record;
use iotans::registry::{Self, Registry};
use iotans::iotans::{Self, IOTANS};
use iotans::iotans_registration::{Self as nft, IotansRegistration};

/// Number of years passed is not within [1-5] interval.
const EInvalidYearsArgument: u64 = 0;
/// Trying to register a subdomain (only *.iota is currently allowed).
/// The payment does not match the price for the domain.
const EIncorrectAmount: u64 = 1;

const EInvalidNewExpiredAt: u64 = 2;
const EGracePeriodPassed: u64 = 3;

/// Authorization token for the app.
public struct Renew has drop {}

/// Renew a registered domain name by a number of years (not exceeding 5).
/// The domain name must be already registered and active; `IotansRegistration`
/// serves as the proof of that.
///
/// We make sure that (in order):
/// - the domain is already registered and active
/// - the IotansRegistration matches the NameRecord.nft_id
/// - the domain TLD is .iota
/// - the domain is not a subdomain
/// - number of years is within [1-5] interval
/// - the new expiration does not exceed 5 years from now
/// - the payment matches the price for the domain
public fun renew(
    iotans: &mut IOTANS,
    nft: &mut IotansRegistration,
    no_years: u8,
    payment: Coin<IOTA>,
    clock: &Clock,
) {
    iotans::assert_app_is_authorized<Renew>(iotans);

    let domain = nft::domain(nft);
    let registry = iotans::registry<Registry>(iotans);

    // Lookup the existing record and verify ownership and expiration including
    // grace period
    let record = option::destroy_some(registry::lookup(registry, domain));
    assert!(object::id(nft) == name_record::nft_id(&record), 0);
    assert!(
        !name_record::has_expired_past_grace_period(&record, clock),
        EGracePeriodPassed,
    );
    assert!(!nft::has_expired_past_grace_period(nft, clock), 0);

    config::assert_valid_user_registerable_domain(&domain);

    let config = iotans::get_config<Config>(iotans);
    assert!(0 < no_years && no_years <= 5, EInvalidYearsArgument);
    let label = domain::sld(&domain);
    let price = config::calculate_price(
        config,
        (string::length(label) as u8),
        no_years,
    );
    assert!(coin::value(&payment) == price, EIncorrectAmount);

    let expiration_timestamp_ms = name_record::expiration_timestamp_ms(&record);
    let new_expiration_timestamp_ms =
        expiration_timestamp_ms + ((no_years as u64) * constants::year_ms());
    // Ensure that the new expiration timestamp is less than 5 years from now
    assert!(
        new_expiration_timestamp_ms - timestamp_ms(clock) <= 5 * constants::year_ms(),
        EInvalidNewExpiredAt,
    );

    let registry = iotans::app_registry_mut<Renew, Registry>(Renew {}, iotans);
    registry::set_expiration_timestamp_ms(
        registry,
        nft,
        domain,
        new_expiration_timestamp_ms,
    );

    iotans::app_add_balance(Renew {}, iotans, coin::into_balance(payment));
}
