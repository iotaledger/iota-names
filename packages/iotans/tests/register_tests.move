// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module iotans::register_sample_tests;

use std::string::{utf8, String};
use iota::clock::{Self, Clock};
use iota::coin;
use iota::iota::IOTA;
use iota::test_scenario::{Self, Scenario, ctx};
use iotans::auction::{Self, App as AuctionApp};
use iotans::auction_tests;
use iotans::config;
use iotans::constants::{nanos_per_iota, grace_period_ms, year_ms};
use iotans::domain;
use iotans::register_sample::{Self as register, Register, register};
use iotans::registry;
use iotans::iotans::{Self, IotaNS, total_balance, AdminCap};
use iotans::iotans_registration::IotansRegistration;

const IOTANS_ADDRESS: address = @0xA001;
const AUCTIONED_DOMAIN_NAME: vector<u8> = b"tes-t2.iota";
const DOMAIN_NAME: vector<u8> = b"abc.iota";

public fun test_init(): Scenario {
    let mut scenario_val = test_scenario::begin(IOTANS_ADDRESS);
    let scenario = &mut scenario_val;
    {
        let mut iotans = iotans::init_for_testing(ctx(scenario));
        iotans.authorize_app_for_testing<Register>();
        iotans.authorize_app_for_testing<AuctionApp>();
        iotans::share_for_testing(iotans);
        let clock = clock::create_for_testing(ctx(scenario));
        clock.share_for_testing();
    };
    {
        scenario.next_tx(IOTANS_ADDRESS);
        let admin_cap = scenario.take_from_sender<AdminCap>();
        let mut iotans = scenario.take_shared<IotaNS>();

        registry::init_for_testing(&admin_cap, &mut iotans, ctx(scenario));

        test_scenario::return_shared(iotans);
        test_scenario::return_to_sender(scenario, admin_cap);
    };
    scenario_val
}

public fun register_util(
    scenario: &mut Scenario,
    domain_name: String,
    no_years: u8,
    amount: u64,
    clock_tick: u64,
): IotansRegistration {
    scenario.next_tx(IOTANS_ADDRESS);
    let mut iotans = scenario.take_shared<IotaNS>();
    let payment = coin::mint_for_testing<IOTA>(amount, ctx(scenario));
    let mut clock = test_scenario::take_shared<Clock>(scenario);

    clock.increment_for_testing(clock_tick);
    let nft = register(
        &mut iotans,
        domain_name,
        no_years,
        payment,
        &clock,
        ctx(scenario),
    );

    test_scenario::return_shared(clock);
    test_scenario::return_shared(iotans);

    nft
}

fun deauthorize_app_util(scenario: &mut Scenario) {
    scenario.next_tx(IOTANS_ADDRESS);
    let admin_cap = scenario.take_from_sender<AdminCap>();
    let mut iotans = scenario.take_shared<IotaNS>();

    iotans::deauthorize_app<Register>(&admin_cap, &mut iotans);

    test_scenario::return_shared(iotans);
    test_scenario::return_to_sender(scenario, admin_cap);
}

public fun assert_balance(scenario: &mut Scenario, amount: u64) {
    scenario.next_tx(IOTANS_ADDRESS);
    let auction_house = scenario.take_shared<IotaNS>();
    assert!(total_balance(&auction_house) == amount, 0);
    test_scenario::return_shared(auction_house);
}

#[test]
fun test_register() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let nft = register_util(
        scenario,
        utf8(DOMAIN_NAME),
        1,
        1200 * nanos_per_iota(),
        10,
    );
    assert_balance(scenario, 1200 * nanos_per_iota());
    assert!(nft.domain() == domain::new(utf8(DOMAIN_NAME)), 0);
    assert!(nft.expiration_timestamp_ms() == year_ms() + 10, 0);
    nft.burn_for_testing();

    let nft = register_util(
        scenario,
        utf8(b"abcd.iota"),
        2,
        400 * nanos_per_iota(),
        20,
    );
    assert_balance(scenario, 1600 * nanos_per_iota());
    assert!(nft.domain() == domain::new(utf8(b"abcd.iota")), 0);
    assert!(nft.expiration_timestamp_ms() == 2 * year_ms() + 30, 0);
    nft.burn_for_testing();

    let nft = register_util(
        scenario,
        utf8(b"abce-f12.iota"),
        3,
        150 * nanos_per_iota(),
        30,
    );
    assert_balance(scenario, 1750 * nanos_per_iota());
    assert!(nft.domain() == domain::new(utf8(b"abce-f12.iota")), 0);
    assert!(nft.expiration_timestamp_ms() == 3 * year_ms() + 60, 0);
    nft.burn_for_testing();

    scenario_val.end();
}

#[test, expected_failure(abort_code = config::EInvalidTld)]
fun test_register_if_not_iota_tld() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let nft = register_util(
        scenario,
        utf8(b"abc.move"),
        1,
        1200 * nanos_per_iota(),
        10,
    );
    nft.burn_for_testing();

    scenario_val.end();
}

#[test, expected_failure(abort_code = register::EIncorrectAmount)]
fun test_register_if_incorrect_amount() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let nft = register_util(
        scenario,
        utf8(DOMAIN_NAME),
        1,
        1210 * nanos_per_iota(),
        10,
    );
    nft.burn_for_testing();

    scenario_val.end();
}

#[test, expected_failure(abort_code = register::EIncorrectAmount)]
fun test_register_if_incorrect_amount_2() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let nft = register_util(
        scenario,
        utf8(DOMAIN_NAME),
        1,
        90 * nanos_per_iota(),
        10,
    );
    nft.burn_for_testing();

    scenario_val.end();
}

#[test, expected_failure(abort_code = register::EInvalidYearsArgument)]
fun test_register_if_no_years_more_than_5_years() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let nft = register_util(
        scenario,
        utf8(DOMAIN_NAME),
        6,
        6 * 1200 * nanos_per_iota(),
        10,
    );
    nft.burn_for_testing();

    scenario_val.end();
}

#[test, expected_failure(abort_code = register::EInvalidYearsArgument)]
fun test_register_if_no_years_is_zero() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let nft = register_util(
        scenario,
        utf8(DOMAIN_NAME),
        0,
        1200 * nanos_per_iota(),
        10,
    );
    nft.burn_for_testing();

    scenario_val.end();
}

#[test]
fun test_register_if_expired() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let nft = register_util(
        scenario,
        utf8(DOMAIN_NAME),
        1,
        1200 * nanos_per_iota(),
        10,
    );
    assert_balance(scenario, 1200 * nanos_per_iota());
    assert!(nft.domain() == domain::new(utf8(DOMAIN_NAME)), 0);
    assert!(nft.expiration_timestamp_ms() == year_ms() + 10, 0);
    nft.burn_for_testing();

    let nft = register_util(
        scenario,
        utf8(DOMAIN_NAME),
        1,
        1200 * nanos_per_iota(),
        year_ms() + grace_period_ms() + 20,
    );
    assert_balance(scenario, 2400 * nanos_per_iota());
    assert!(nft.domain() == domain::new(utf8(DOMAIN_NAME)), 0);
    assert!(
        nft.expiration_timestamp_ms() == 2 * year_ms() + grace_period_ms() + 30,
        0,
    );
    nft.burn_for_testing();

    scenario_val.end();
}

#[test, expected_failure(abort_code = registry::ERecordNotExpired)]
fun test_register_if_not_expired() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let nft = register_util(
        scenario,
        utf8(DOMAIN_NAME),
        1,
        1200 * nanos_per_iota(),
        10,
    );
    assert_balance(scenario, 1200 * nanos_per_iota());
    assert!(nft.domain() == domain::new(utf8(DOMAIN_NAME)), 0);
    assert!(nft.expiration_timestamp_ms() == year_ms() + 10, 0);
    nft.burn_for_testing();

    let nft = register_util(
        scenario,
        utf8(DOMAIN_NAME),
        1,
        1200 * nanos_per_iota(),
        20,
    );
    nft.burn_for_testing();

    scenario_val.end();
}

#[test, expected_failure(abort_code = domain::EInvalidDomain)]
fun test_register_if_domain_name_starts_with_dash() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let nft = register_util(
        scenario,
        utf8(b"-ab.iota"),
        1,
        1200 * nanos_per_iota(),
        10,
    );
    nft.burn_for_testing();

    scenario_val.end();
}

#[test, expected_failure(abort_code = domain::EInvalidDomain)]
fun test_register_if_domain_name_ends_with_dash() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let nft = register_util(
        scenario,
        utf8(b"ab-.iota"),
        1,
        1200 * nanos_per_iota(),
        10,
    );
    nft.burn_for_testing();

    scenario_val.end();
}

#[test, expected_failure(abort_code = domain::EInvalidDomain)]
fun test_register_if_domain_name_contains_uppercase_character() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let nft = register_util(
        scenario,
        utf8(b"Abc.com"),
        1,
        1200 * nanos_per_iota(),
        10,
    );
    nft.burn_for_testing();

    scenario_val.end();
}

#[test, expected_failure(abort_code = config::ELabelTooShort)]
fun test_register_if_domain_name_too_short() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let nft = register_util(
        scenario,
        utf8(b"ab.iota"),
        1,
        1200 * nanos_per_iota(),
        10,
    );
    nft.burn_for_testing();

    scenario_val.end();
}

#[test, expected_failure(abort_code = config::EInvalidDomain)]
fun test_register_if_domain_name_contains_subdomain() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let nft = register_util(
        scenario,
        utf8(b"abc.xyz.iota"),
        1,
        1200 * nanos_per_iota(),
        10,
    );
    nft.burn_for_testing();

    scenario_val.end();
}

#[test, expected_failure(abort_code = registry::ERecordNotExpired)]
fun test_register_aborts_if_domain_name_went_through_auction() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    auction::init_for_testing(ctx(scenario));

    auction_tests::normal_auction_flow(scenario);
    let nft = register_util(
        scenario,
        utf8(AUCTIONED_DOMAIN_NAME),
        1,
        50 * nanos_per_iota(),
        10,
    );
    nft.burn_for_testing();

    scenario_val.end();
}

#[test]
fun test_register_works_if_auctioned_domain_name_expired() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    auction::init_for_testing(ctx(scenario));

    auction_tests::normal_auction_flow(scenario);
    let nft = register_util(
        scenario,
        utf8(AUCTIONED_DOMAIN_NAME),
        1,
        50 * nanos_per_iota(),
        year_ms() + grace_period_ms() + 20,
    );
    assert_balance(scenario, 50 * nanos_per_iota());
    assert!(nft.domain() == domain::new(utf8(AUCTIONED_DOMAIN_NAME)), 0);
    nft.burn_for_testing();

    scenario_val.end();
}

#[test, expected_failure(abort_code = ::iotans::iotans::EAppNotAuthorized)]
fun test_register_aborts_if_register_is_deauthorized() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    deauthorize_app_util(scenario);
    let nft = register_util(
        scenario,
        utf8(DOMAIN_NAME),
        1,
        1200 * nanos_per_iota(),
        10,
    );
    nft.burn_for_testing();

    scenario_val.end();
}
