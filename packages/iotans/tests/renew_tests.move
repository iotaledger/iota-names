// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module iotans::renew_tests;

use std::string::utf8;
use iota::clock::{Self, Clock};
use iota::coin;
use iota::iota::IOTA;
use iota::test_scenario::{Self, Scenario, ctx};
use iotans::constants::{nanos_per_iota, year_ms};
use iotans::register_sample::Register;
use iotans::register_sample_tests::{register_util, assert_balance};
use iotans::registry;
use iotans::renew::{Self, Renew, renew};
use iotans::iotans::{Self, IotaNS, AdminCap};
use iotans::iotans_registration::IotansRegistration;

const IOTANS_ADDRESS: address = @0xA001;
const DOMAIN_NAME: vector<u8> = b"abc.iota";

public fun test_init(): Scenario {
    let mut scenario_val = test_scenario::begin(IOTANS_ADDRESS);
    let scenario = &mut scenario_val;
    {
        let mut iotans = iotans::init_for_testing(ctx(scenario));
        iotans.authorize_app_for_testing<Renew>();
        iotans.authorize_app_for_testing<Register>();
        iotans.share_for_testing();
        let clock = clock::create_for_testing(ctx(scenario));
        clock::share_for_testing(clock);
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

fun renew_util(
    scenario: &mut Scenario,
    nft: &mut IotansRegistration,
    no_years: u8,
    amount: u64,
    clock_tick: u64,
) {
    scenario.next_tx(IOTANS_ADDRESS);
    let mut iotans = scenario.take_shared<IotaNS>();
    let payment = coin::mint_for_testing<IOTA>(amount, ctx(scenario));
    let mut clock = test_scenario::take_shared<Clock>(scenario);

    clock.increment_for_testing(clock_tick);
    renew(&mut iotans, nft, no_years, payment, &clock);

    test_scenario::return_shared(clock);
    test_scenario::return_shared(iotans);
}

fun deauthorize_app_util(scenario: &mut Scenario) {
    scenario.next_tx(IOTANS_ADDRESS);
    let admin_cap = scenario.take_from_sender<AdminCap>();
    let mut iotans = scenario.take_shared<IotaNS>();

    iotans::deauthorize_app<Renew>(&admin_cap, &mut iotans);

    test_scenario::return_shared(iotans);
    test_scenario::return_to_sender(scenario, admin_cap);
}

#[test]
fun test_renew() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let mut nft = register_util(
        scenario,
        utf8(b"abcd.iota"),
        1,
        200 * nanos_per_iota(),
        0,
    );
    assert!(nft.expiration_timestamp_ms() == year_ms(), 0);
    renew_util(scenario, &mut nft, 1, 200 * nanos_per_iota(), 0);
    assert_balance(scenario, 400 * nanos_per_iota());
    nft.burn_for_testing();

    let mut nft = register_util(
        scenario,
        utf8(b"abcde.iota"),
        1,
        50 * nanos_per_iota(),
        0,
    );
    assert!(nft.expiration_timestamp_ms() == year_ms(), 0);
    renew_util(scenario, &mut nft, 1, 50 * nanos_per_iota(), 0);
    assert_balance(scenario, 500 * nanos_per_iota());
    nft.burn_for_testing();

    let mut nft = register_util(
        scenario,
        utf8(DOMAIN_NAME),
        1,
        1200 * nanos_per_iota(),
        10,
    );
    assert!(nft.expiration_timestamp_ms() == year_ms() + 10, 0);
    renew_util(scenario, &mut nft, 1, 1200 * nanos_per_iota(), 0);
    assert_balance(scenario, 2900 * nanos_per_iota());
    assert!(nft.expiration_timestamp_ms() == 2 * year_ms() + 10, 0);
    renew_util(scenario, &mut nft, 2, 2400 * nanos_per_iota(), 0);
    assert_balance(scenario, 5300 * nanos_per_iota());
    assert!(nft.expiration_timestamp_ms() == 4 * year_ms() + 10, 0);
    nft.burn_for_testing();

    scenario_val.end();
}

#[test, expected_failure(abort_code = renew::EIncorrectAmount)]
fun test_renew_aborts_if_incorrect_amount() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let mut nft = register_util(
        scenario,
        utf8(DOMAIN_NAME),
        1,
        1200 * nanos_per_iota(),
        10,
    );
    renew_util(scenario, &mut nft, 1, 1210 * nanos_per_iota(), 0);
    nft.burn_for_testing();

    scenario_val.end();
}

#[test, expected_failure(abort_code = renew::EIncorrectAmount)]
fun test_renew_aborts_if_incorrect_amount_2() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let mut nft = register_util(
        scenario,
        utf8(DOMAIN_NAME),
        1,
        1200 * nanos_per_iota(),
        10,
    );
    renew_util(scenario, &mut nft, 1, 10 * nanos_per_iota(), 0);
    nft.burn_for_testing();

    scenario_val.end();
}

#[test, expected_failure(abort_code = renew::EGracePeriodPassed)]
fun test_renew_aborts_if_nft_expired() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let mut nft = register_util(
        scenario,
        utf8(DOMAIN_NAME),
        1,
        1200 * nanos_per_iota(),
        10,
    );
    renew_util(
        scenario,
        &mut nft,
        1,
        1200 * nanos_per_iota(),
        2 * year_ms() + 20,
    );
    nft.burn_for_testing();

    scenario_val.end();
}

#[test, expected_failure(abort_code = renew::EInvalidYearsArgument)]
fun test_renew_aborts_no_years_more_than_5_years() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let mut nft = register_util(
        scenario,
        utf8(DOMAIN_NAME),
        1,
        1200 * nanos_per_iota(),
        0,
    );
    renew_util(scenario, &mut nft, 6, 7200 * nanos_per_iota(), 0);
    nft.burn_for_testing();

    scenario_val.end();
}

#[test, expected_failure(abort_code = renew::EInvalidNewExpiredAt)]
fun test_renew_aborts_new_expiry_more_than_5_years() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let mut nft = register_util(
        scenario,
        utf8(DOMAIN_NAME),
        1,
        1200 * nanos_per_iota(),
        0,
    );
    renew_util(scenario, &mut nft, 2, 2400 * nanos_per_iota(), 0);
    renew_util(scenario, &mut nft, 4, 4800 * nanos_per_iota(), 0);
    nft.burn_for_testing();

    scenario_val.end();
}

#[test, expected_failure(abort_code = ::iotans::iotans::EAppNotAuthorized)]
fun test_renew_aborts_if_renew_is_deauthorized() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let mut nft = register_util(
        scenario,
        utf8(DOMAIN_NAME),
        1,
        1200 * nanos_per_iota(),
        0,
    );
    deauthorize_app_util(scenario);
    renew_util(scenario, &mut nft, 2, 2400 * nanos_per_iota(), 0);
    nft.burn_for_testing();

    scenario_val.end();
}
