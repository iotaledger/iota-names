// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module iota_names::renew_tests;

use std::string::utf8;
use iota::clock::{Self, Clock};
use iota::coin;
use iota::iota::IOTA;
use iota::test_scenario::{Self, Scenario, ctx};
use iota_names::constants::{nanos_per_iota, year_ms};
use iota_names::register_sample::Register;
use iota_names::register_sample_tests::{register_util, assert_balance};
use iota_names::registry;
use iota_names::renew::{Self, Renew, renew};
use iota_names::iota_names::{Self, IotaNames, AdminCap};
use iota_names::iota_names_nft::IotaNamesNft;

const IOTA_NAMES_ADDRESS: address = @0xA001;
const DOMAIN_NAME: vector<u8> = b"abc.iota";

public fun test_init(): Scenario {
    let mut scenario_val = test_scenario::begin(IOTA_NAMES_ADDRESS);
    let scenario = &mut scenario_val;
    {
        let mut iota_names = iota_names::init_for_testing(ctx(scenario));
        iota_names.authorize_app_for_testing<Renew>();
        iota_names.authorize_app_for_testing<Register>();
        iota_names.share_for_testing();
        let clock = clock::create_for_testing(ctx(scenario));
        clock::share_for_testing(clock);
    };
    {
        scenario.next_tx(IOTA_NAMES_ADDRESS);
        let admin_cap = scenario.take_from_sender<AdminCap>();
        let mut iota_names = scenario.take_shared<IotaNames>();

        registry::init_for_testing(&admin_cap, &mut iota_names, ctx(scenario));

        test_scenario::return_shared(iota_names);
        test_scenario::return_to_sender(scenario, admin_cap);
    };
    scenario_val
}

fun renew_util(
    scenario: &mut Scenario,
    nft: &mut IotaNamesNft,
    no_years: u8,
    amount: u64,
    clock_tick: u64,
) {
    scenario.next_tx(IOTA_NAMES_ADDRESS);
    let mut iota_names = scenario.take_shared<IotaNames>();
    let payment = coin::mint_for_testing<IOTA>(amount, ctx(scenario));
    let mut clock = test_scenario::take_shared<Clock>(scenario);

    clock.increment_for_testing(clock_tick);
    renew(&mut iota_names, nft, no_years, payment, &clock);

    test_scenario::return_shared(clock);
    test_scenario::return_shared(iota_names);
}

fun deauthorize_app_util(scenario: &mut Scenario) {
    scenario.next_tx(IOTA_NAMES_ADDRESS);
    let admin_cap = scenario.take_from_sender<AdminCap>();
    let mut iota_names = scenario.take_shared<IotaNames>();

    iota_names::deauthorize_app<Renew>(&admin_cap, &mut iota_names);

    test_scenario::return_shared(iota_names);
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

#[test, expected_failure(abort_code = ::iota_names::iota_names::EAppNotAuthorized)]
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
