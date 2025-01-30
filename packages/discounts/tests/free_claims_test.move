// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module discounts::free_claims_tests;

use day_one::day_one::{Self, DayOne};
use discounts::free_claims;
use discounts::house::{Self, DiscountHouse, DiscountHouseApp};
use std::string::{utf8, String};
use iota::clock::{Self, Clock};
use iota::test_scenario::{Self as ts, Scenario, ctx};
use iotans::registry;
use iotans::iotans::{Self, IOTANS, AdminCap};

// An authorized type to test.
public struct TestAuthorized has key, store { id: UID }

// An unauthorized type to test.
public struct TestUnauthorized has key { id: UID }

const iotaNS_ADDRESS: address = @0xA001;
const USER_ADDRESS: address = @0xA002;

fun test_init(): Scenario {
    let mut scenario_val = ts::begin(iotaNS_ADDRESS);
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
        ts::next_tx(scenario, iotaNS_ADDRESS);
        let admin_cap = scenario.take_from_sender<AdminCap>();
        let mut iotans = scenario.take_shared<IOTANS>();
        let mut discount_house = scenario.take_shared<DiscountHouse>();

        // a more expensive alternative.
        free_claims::authorize_type<TestAuthorized>(
            &admin_cap,
            &mut discount_house,
            vector[10, 63],
            scenario.ctx(),
        );
        free_claims::authorize_type<DayOne>(
            &admin_cap,
            &mut discount_house,
            vector[10, 63],
            scenario.ctx(),
        );
        registry::init_for_testing(&admin_cap, &mut iotans, scenario.ctx());

        ts::return_shared(discount_house);
        ts::return_shared(iotans);
        ts::return_to_sender(scenario, admin_cap);
    };
    scenario_val
}

fun test_end(mut scenario_val: Scenario) {
    let scenario = &mut scenario_val;
    {
        ts::next_tx(scenario, iotaNS_ADDRESS);
        let admin_cap = scenario.take_from_sender<AdminCap>();
        let mut discount_house = scenario.take_shared<DiscountHouse>();
        free_claims::deauthorize_type<TestAuthorized>(
            &admin_cap,
            &mut discount_house,
        );
        free_claims::deauthorize_type<DayOne>(&admin_cap, &mut discount_house);
        ts::return_shared(discount_house);
        ts::return_to_sender(scenario, admin_cap);
    };
    ts::end(scenario_val);
}

fun burn_authorized(authorized: TestAuthorized) {
    let TestAuthorized { id } = authorized;
    id.delete();
}

fun free_claim_with_type<T: key>(
    item: &T,
    scenario: &mut Scenario,
    domain_name: String,
    user: address,
) {
    ts::next_tx(scenario, user);
    let mut iotans = scenario.take_shared<IOTANS>();
    let mut discount_house = scenario.take_shared<DiscountHouse>();
    let clock = scenario.take_shared<Clock>();

    let name = free_claims::free_claim<T>(
        &mut discount_house,
        &mut iotans,
        item,
        domain_name,
        &clock,
        scenario.ctx(),
    );

    transfer::public_transfer(name, user);

    ts::return_shared(discount_house);
    ts::return_shared(iotans);
    ts::return_shared(clock);
}

fun free_claim_with_day_one(
    item: &DayOne,
    scenario: &mut Scenario,
    domain_name: String,
    user: address,
) {
    ts::next_tx(scenario, user);
    let mut iotans = ts::take_shared<IOTANS>(scenario);
    let mut discount_house = ts::take_shared<DiscountHouse>(scenario);
    let clock = ts::take_shared<Clock>(scenario);

    let name = free_claims::free_claim_with_day_one(
        &mut discount_house,
        &mut iotans,
        item,
        domain_name,
        &clock,
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

    let test_item = TestAuthorized {
        id: object::new(scenario.ctx()),
    };

    free_claim_with_type<TestAuthorized>(
        &test_item,
        scenario,
        utf8(b"01234567890.iota"),
        USER_ADDRESS,
    );

    burn_authorized(test_item);
    test_end(scenario_val);
}

#[test]
fun use_day_one() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let mut day_one = day_one::mint_for_testing(scenario.ctx());
    day_one.set_is_active_for_testing(true);

    free_claim_with_day_one(
        &day_one,
        scenario,
        utf8(b"0123456789.iota"),
        USER_ADDRESS,
    );

    day_one.burn_for_testing();
    test_end(scenario_val);
}

#[test, expected_failure(abort_code = discounts::free_claims::EAlreadyClaimed)]
fun test_tries_to_claim_again_with_same_object_failure() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let test_item = TestAuthorized {
        id: object::new(scenario.ctx()),
    };

    free_claim_with_type<TestAuthorized>(
        &test_item,
        scenario,
        utf8(b"01234567890.iota"),
        USER_ADDRESS,
    );

    // tries to claim again using the same test_item.
    free_claim_with_type<TestAuthorized>(
        &test_item,
        scenario,
        utf8(b"01234567891.iota"),
        USER_ADDRESS,
    );

    burn_authorized(test_item);
    test_end(scenario_val);
}

#[
    test,
    expected_failure(
        abort_code = discounts::free_claims::EInvalidCharacterRange,
    ),
]
fun test_invalid_size_failure() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let test_item = TestAuthorized {
        id: object::new(scenario.ctx()),
    };

    free_claim_with_type<TestAuthorized>(
        &test_item,
        scenario,
        utf8(b"012345678.iota"),
        USER_ADDRESS,
    );

    burn_authorized(test_item);
    test_end(scenario_val);
}

#[test, expected_failure(abort_code = discounts::free_claims::EConfigNotExists)]
fun register_with_unauthorized_type() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let test_item = TestUnauthorized {
        id: object::new(scenario.ctx()),
    };

    free_claim_with_type<TestUnauthorized>(
        &test_item,
        scenario,
        utf8(b"test.iota"),
        USER_ADDRESS,
    );

    abort 1337
}
