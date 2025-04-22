// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module iota_names_coupons::setup;

use iota::{clock, test_scenario::{Self, Scenario, ctx}};
use iota_names::{iota_names::{Self, AdminCap, IotaNames}, registry};
use iota_names_coupons::{
    coupon_constants,
    coupon_house::{Self, CouponsApp},
    data::Data,
    range,
    rules
};
use std::string::{utf8, String};

public struct TestApp has drop {}

public struct UnauthorizedTestApp has drop {}

const NANOS_PER_IOTA: u64 = 1_000_000_000;

const ADMIN_ADDRESS: address = @0xA001;
const USER_ADDRESS: address = @0xA002;
const USER_2_ADDRESS: address = @0xA003;

public fun test_init(): Scenario {
    let mut scenario_val = test_scenario::begin(ADMIN_ADDRESS);
    let scenario = &mut scenario_val;
    initialize_coupon_house(scenario);
    scenario_val
}

public fun initialize_coupon_house(scenario: &mut Scenario) {
    {
        let mut iota_names = iota_names::init_for_testing(scenario.ctx());
        iota_names::authorize_app_for_testing<CouponsApp>(&mut iota_names);
        iota_names::share_for_testing(iota_names);
        let clock = clock::create_for_testing(scenario.ctx());
        clock::share_for_testing(clock);
    };
    {
        scenario.next_tx(ADMIN_ADDRESS);
        // get admin cap
        let admin_cap = scenario.take_from_sender<AdminCap>();
        let mut iota_names = scenario.take_shared<IotaNames>();
        // initialize coupon data.
        coupon_house::setup(&mut iota_names, &admin_cap, scenario.ctx());
        registry::init_for_testing(&admin_cap, &mut iota_names, scenario.ctx());
        // authorize TestApp to CouponHouse.
        coupon_house::authorize_app<TestApp>(&admin_cap, &mut iota_names);
        test_scenario::return_to_sender(scenario, admin_cap);
        test_scenario::return_shared(iota_names);
    };
}

public fun admin(): address {
    ADMIN_ADDRESS
}

public fun user(): address {
    USER_ADDRESS
}

public fun user_two(): address {
    USER_2_ADDRESS
}

public fun nanos_per_iota(): u64 {
    NANOS_PER_IOTA
}

// global getters.

public fun test_app(): TestApp {
    TestApp {}
}

public fun unauthorized_test_app(): UnauthorizedTestApp {
    UnauthorizedTestApp {}
}

/// A helper to add a bunch of coupons (with different setups) that we can use
/// on the coupon tests.
public fun populate_coupons(data_mut: &mut Data, ctx: &mut TxContext) {
    // 25% DISCOUNT, ONLY FOR 2 YEARS OR LESS REGISTRATIONS
    coupon_house::app_add_coupon(
        data_mut,
        utf8(b"25_PERCENT_DISCOUNT_MAX_2_YEARS"),
        coupon_constants::percentage_discount_type(),
        25, // 25%
        rules::new_coupon_rules(
            option::none(),
            option::none(),
            option::none(),
            option::none(),
            option::some(range::new(1, 2)),
        ),
        ctx,
    );

    // 25% DISCOUNT, only claimable ONCE by a specific user
    coupon_house::app_add_coupon(
        data_mut,
        utf8(b"25_PERCENT_DISCOUNT_USER_ONLY"),
        coupon_constants::percentage_discount_type(),
        25, // 25%
        rules::new_coupon_rules(
            option::none(),
            option::some(1),
            option::some(user()),
            option::none(),
            option::none(),
        ),
        ctx,
    );

    // 50% DISCOUNT, only claimable only for names > 5 digits
    coupon_house::app_add_coupon(
        data_mut,
        utf8(b"50_PERCENT_5_PLUS_NAMES"),
        coupon_constants::percentage_discount_type(),
        50, // 25%
        rules::new_coupon_rules(
            option::some(range::new(5, 63)),
            option::some(1),
            option::none(),
            option::none(),
            option::none(),
        ),
        ctx,
    );

    // 50% DISCOUNT, only for 3 digit names
    coupon_house::app_add_coupon(
        data_mut,
        utf8(b"50_PERCENT_3_DIGITS"),
        coupon_constants::percentage_discount_type(),
        50, // 50%
        rules::new_coupon_rules(
            option::some(range::new(3, 3)),
            option::none(),
            option::none(),
            option::some(1),
            option::none(),
        ),
        ctx,
    );

    // 50% DISCOUNT, has all rules so we can test combinations!
    coupon_house::app_add_coupon(
        data_mut,
        utf8(b"50_DISCOUNT_SALAD"),
        coupon_constants::percentage_discount_type(),
        50, // 50%
        rules::new_coupon_rules(
            option::some(range::new(3, 4)),
            option::some(1),
            option::some(user()),
            option::some(1),
            option::some(range::new(1, 2)),
        ),
        ctx,
    );

    // THESE last two are just for easy coverage.
    // We just add + remove the coupon immediately.
    coupon_house::app_add_coupon(
        data_mut,
        utf8(b"REMOVE_FOR_COVERAGE"),
        coupon_constants::percentage_discount_type(),
        50,
        rules::new_empty_rules(),
        ctx,
    );
    coupon_house::app_remove_coupon(data_mut, utf8(b"REMOVE_FOR_COVERAGE"));
}

// Adds a 0 rule coupon that gives 15% discount to test admin additions.
public fun admin_add_coupon(code_name: String, kind: u8, value: u64, scenario: &mut Scenario) {
    scenario.next_tx(admin());
    let mut iota_names = scenario.take_shared<IotaNames>();
    let cap = scenario.take_from_sender<AdminCap>();
    coupon_house::admin_add_coupon(
        &cap,
        &mut iota_names,
        code_name,
        kind,
        value,
        rules::new_empty_rules(),
        scenario.ctx(),
    );
    scenario.return_to_sender(cap);
    test_scenario::return_shared(iota_names);
}

// Adds a 0 rule coupon that gives 15% discount to test admin additions.
public fun admin_remove_coupon(code_name: String, scenario: &mut Scenario) {
    scenario.next_tx(admin());
    let mut iota_names = scenario.take_shared<IotaNames>();
    let cap = scenario.take_from_sender<AdminCap>();
    coupon_house::admin_remove_coupon(
        &cap,
        &mut iota_names,
        code_name,
    );
    scenario.return_to_sender(cap);
    test_scenario::return_shared(iota_names);
}
