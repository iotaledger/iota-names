// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module discounts::discount_tests;

use day_one::day_one::{Self, DayOne};
use discounts::discounts;
use discounts::house::{Self, DiscountHouse, DiscountHouseApp};
use std::string::{utf8, String};
use iota::clock::{Self, Clock};
use iota::coin::{Self, Coin};
use iota::iota::IOTA;
use iota::test_scenario::{Self as ts, Scenario, ctx};
use iotans::registry;
use iotans::iotans::{Self, IotaNS, AdminCap};

// an authorized type to test.
public struct TestAuthorized has copy, store, drop {}

// another authorized type to test.
public struct AnotherAuthorized has copy, store, drop {}

// an unauthorized type to test.
public struct TestUnauthorized has copy, store, drop {}

const IOTANS_ADDRESS: address = @0xA001;
const USER_ADDRESS: address = @0xA002;

const NANOS_PER_iota: u64 = 1_000_000_000;

fun test_init(): Scenario {
    let mut scenario_val = ts::begin(IOTANS_ADDRESS);
    let scenario = &mut scenario_val;
    {
        let mut iotans = iotans::init_for_testing(scenario.ctx());
        iotans.authorize_app_for_testing<DiscountHouseApp>();
        iotans.share_for_testing();
        house::init_for_testing(scenario.ctx());
        let clock = clock::create_for_testing(scenario.ctx());
        clock.share_for_testing();
    };
    {
        scenario.next_tx(IOTANS_ADDRESS);
        let admin_cap = scenario.take_from_sender<AdminCap>();
        let mut iotans = scenario.take_shared<IotaNS>();
        let mut discount_house = scenario.take_shared<DiscountHouse>();

        // a more expensive alternative.
        discounts::authorize_type<TestAuthorized>(
            &admin_cap,
            &mut discount_house,
            3*NANOS_PER_iota,
            2*NANOS_PER_iota,
            1*NANOS_PER_iota,
        );
        // a much cheaper price for another type.
        discounts::authorize_type<AnotherAuthorized>(
            &admin_cap,
            &mut discount_house,
            NANOS_PER_iota / 20,
            NANOS_PER_iota / 10,
            NANOS_PER_iota / 5,
        );
        discounts::authorize_type<DayOne>(
            &admin_cap,
            &mut discount_house,
            NANOS_PER_iota,
            NANOS_PER_iota,
            NANOS_PER_iota,
        );

        registry::init_for_testing(&admin_cap, &mut iotans, scenario.ctx());

        ts::return_shared(discount_house);
        ts::return_shared(iotans);
        ts::return_to_sender(scenario, admin_cap);
    };
    scenario_val
}

fun register_with_type<T>(
    item: &T,
    scenario: &mut Scenario,
    domain_name: String,
    payment: Coin<IOTA>,
    user: address,
) {
    scenario.next_tx(user);
    let mut iotans = scenario.take_shared<IotaNS>();
    let mut discount_house = scenario.take_shared<DiscountHouse>();
    let clock = scenario.take_shared<Clock>();

    let name = discounts::register<T>(
        &mut discount_house,
        &mut iotans,
        item,
        domain_name,
        payment,
        &clock,
        option::none(),
        scenario.ctx(),
    );

    transfer::public_transfer(name, user);

    ts::return_shared(discount_house);
    ts::return_shared(iotans);
    ts::return_shared(clock);
}

fun register_with_day_one(
    item: &DayOne,
    scenario: &mut Scenario,
    domain_name: String,
    payment: Coin<IOTA>,
    user: address,
) {
    scenario.next_tx(user);
    let mut iotans = scenario.take_shared<IotaNS>();
    let mut discount_house = scenario.take_shared<DiscountHouse>();
    let clock = scenario.take_shared<Clock>();

    let name = discounts::register_with_day_one(
        &mut discount_house,
        &mut iotans,
        item,
        domain_name,
        payment,
        &clock,
        option::none(),
        scenario.ctx(),
    );

    transfer::public_transfer(name, user);

    ts::return_shared(discount_house);
    ts::return_shared(iotans);
    ts::return_shared(clock);
}

#[test]
fun test_e2e() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let test_item = TestAuthorized {};
    let payment: Coin<IOTA> = coin::mint_for_testing(
        2*NANOS_PER_iota,
        scenario.ctx(),
    );

    register_with_type<TestAuthorized>(
        &test_item,
        scenario,
        utf8(b"test.iota"),
        payment,
        USER_ADDRESS,
    );

    scenario_val.end();
}

#[test, expected_failure(abort_code = ::discounts::discounts::EConfigNotExists)]
fun register_with_unauthorized_type() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let test_item = TestUnauthorized {};
    let payment: Coin<IOTA> = coin::mint_for_testing(
        2*NANOS_PER_iota,
        scenario.ctx(),
    );

    register_with_type<TestUnauthorized>(
        &test_item,
        scenario,
        utf8(b"test.iota"),
        payment,
        USER_ADDRESS,
    );
    scenario_val.end();
}

#[test]
fun use_day_one() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let mut day_one = day_one::mint_for_testing(scenario.ctx());
    day_one::set_is_active_for_testing(&mut day_one, true);
    let payment: Coin<IOTA> = coin::mint_for_testing(
        NANOS_PER_iota,
        scenario.ctx(),
    );

    register_with_day_one(
        &day_one,
        scenario,
        utf8(b"test.iota"),
        payment,
        USER_ADDRESS,
    );

    day_one.burn_for_testing();
    scenario_val.end();
}

#[
    test,
    expected_failure(
        abort_code = ::discounts::discounts::ENotValidForDayOne,
    ),
]
fun use_day_one_for_casual_flow_failure() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let mut day_one = day_one::mint_for_testing(scenario.ctx());
    day_one::set_is_active_for_testing(&mut day_one, true);
    let payment: Coin<IOTA> = coin::mint_for_testing(
        NANOS_PER_iota,
        scenario.ctx(),
    );

    register_with_type<DayOne>(
        &day_one,
        scenario,
        utf8(b"test.iota"),
        payment,
        USER_ADDRESS,
    );

    day_one.burn_for_testing();
    scenario_val.end();
}

#[test, expected_failure(abort_code = ::discounts::discounts::ENotActiveDayOne)]
fun use_inactive_day_one_failure() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let day_one = day_one::mint_for_testing(scenario.ctx());
    let payment: Coin<IOTA> = coin::mint_for_testing(
        NANOS_PER_iota,
        scenario.ctx(),
    );

    register_with_day_one(
        &day_one,
        scenario,
        utf8(b"test.iota"),
        payment,
        USER_ADDRESS,
    );

    day_one.burn_for_testing();
    scenario_val.end();
}
