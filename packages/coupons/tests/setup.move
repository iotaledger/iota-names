// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module iota_names_coupons::setup;

use iota::clock;
use iota::hash::blake2b256;
use iota::test_scenario::{Self, Scenario, ctx};
use iota_names::iota_names::{Self, AdminCap, IotaNames};
use iota_names::registry;
use iota_names_coupons::coupon_house::{Self, CouponsAuth};
use iota_names_coupons::coupons::Coupons;
use iota_names_coupons::range;
use iota_names_coupons::rules;
use std::string::String;

public struct TestAuth has drop {}

public struct UnauthorizedTestAuth has drop {}

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
        iota_names::authorize_for_testing<CouponsAuth>(&mut iota_names);
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
        // authorize TestAuth to CouponHouse.
        coupon_house::authorize<TestAuth>(&admin_cap, &mut iota_names);
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

public fun test_app(): TestAuth {
    TestAuth {}
}

public fun unauthorized_test_app(): UnauthorizedTestAuth {
    UnauthorizedTestAuth {}
}

/// A helper to add a bunch of coupons (with different setups) that we can use
/// on the coupon tests.
public fun populate_coupons(data_mut: &mut Coupons) {
    // 25% DISCOUNT, ONLY FOR 2 YEARS OR LESS REGISTRATIONS
    coupon_house::app_add_percentage_coupon(
        data_mut,
        blake2b256(&b"25_PERCENT_DISCOUNT_MAX_2_YEARS"),
        25, // 25%
        rules::new_coupon_rules(
            option::none(),
            option::none(),
            option::none(),
            option::none(),
            option::some(range::new(1, 2)),
            false,
        ),
    );

    // 25% DISCOUNT, only claimable ONCE by a specific user
    coupon_house::app_add_percentage_coupon(
        data_mut,
        blake2b256(&b"25_PERCENT_DISCOUNT_USER_ONLY"),
        25, // 25%
        rules::new_coupon_rules(
            option::none(),
            option::some(1),
            option::some(user()),
            option::none(),
            option::none(),
            false,
        ),
    );

    // 50% DISCOUNT, only claimable only for names > 5 digits
    coupon_house::app_add_percentage_coupon(
        data_mut,
        blake2b256(&b"50_PERCENT_5_PLUS_NAMES"),
        50, // 25%
        rules::new_coupon_rules(
            option::some(range::new(5, 63)),
            option::some(1),
            option::none(),
            option::none(),
            option::none(),
            false,
        ),
    );

    // 50% DISCOUNT, only for 3 digit names
    coupon_house::app_add_percentage_coupon(
        data_mut,
        blake2b256(&b"50_PERCENT_3_DIGITS"),
        50, // 50%
        rules::new_coupon_rules(
            option::some(range::new(3, 3)),
            option::none(),
            option::none(),
            option::some(1),
            option::none(),
            false,
        ),
    );

    // 50% DISCOUNT, has all rules so we can test combinations!
    coupon_house::app_add_percentage_coupon(
        data_mut,
        blake2b256(&b"50_DISCOUNT_SALAD"),
        50, // 50%
        rules::new_coupon_rules(
            option::some(range::new(3, 4)),
            option::some(1),
            option::some(user()),
            option::some(1),
            option::some(range::new(1, 2)),
            false,
        ),
    );

    // 5% DISCOUNT, can be stacked
    coupon_house::app_add_percentage_coupon(
        data_mut,
        blake2b256(&b"5_DISCOUNT_STACKABLE"),
        5, // 5%
        rules::new_coupon_rules(
            option::none(),
            option::none(),
            option::none(),
            option::none(),
            option::none(),
            true,
        ),
    );

    // 1 IOTA DISCOUNT
    coupon_house::app_add_fixed_coupon(
        data_mut,
        blake2b256(&b"ONE_IOTA_OFF"),
        nanos_per_iota(),
        rules::new_coupon_rules(
            option::none(),
            option::none(),
            option::none(),
            option::none(),
            option::none(),
            false,
        ),
    );

    // THESE last two are just for easy coverage.
    // We just add + remove the coupon immediately.
    coupon_house::app_add_percentage_coupon(
        data_mut,
        blake2b256(&b"REMOVE_FOR_COVERAGE"),
        50,
        rules::new_empty_rules(),
    );
    coupon_house::app_remove_coupon(data_mut, blake2b256(&b"REMOVE_FOR_COVERAGE"));
}

// Adds a percentage based coupon that gives a discount to test admin additions.
public fun admin_add_percentage_coupon(code_name: String, value: u64, scenario: &mut Scenario) {
    scenario.next_tx(admin());
    let mut iota_names = scenario.take_shared<IotaNames>();
    let cap = scenario.take_from_sender<AdminCap>();
    let hash = blake2b256(code_name.as_bytes());
    coupon_house::admin_add_percentage_coupon(
        &cap,
        &mut iota_names,
        hash,
        value,
        rules::new_empty_rules(),
    );
    scenario.return_to_sender(cap);
    test_scenario::return_shared(iota_names);
}

// Adds a fixed discount coupon that gives a discount to test admin additions.
public fun admin_add_fixed_coupon(code_name: String, value: u64, scenario: &mut Scenario) {
    scenario.next_tx(admin());
    let mut iota_names = scenario.take_shared<IotaNames>();
    let cap = scenario.take_from_sender<AdminCap>();
    let hash = blake2b256(code_name.as_bytes());
    coupon_house::admin_add_fixed_coupon(
        &cap,
        &mut iota_names,
        hash,
        value,
        rules::new_empty_rules(),
    );
    scenario.return_to_sender(cap);
    test_scenario::return_shared(iota_names);
}

// Adds a 0 rule coupon that gives 15% discount to test admin additions.
public fun admin_remove_coupon(code_name: String, scenario: &mut Scenario) {
    scenario.next_tx(admin());
    let mut iota_names = scenario.take_shared<IotaNames>();
    let cap = scenario.take_from_sender<AdminCap>();
    let hash = blake2b256(code_name.as_bytes());
    coupon_house::admin_remove_coupon(
        &cap,
        &mut iota_names,
        hash,
    );
    scenario.return_to_sender(cap);
    test_scenario::return_shared(iota_names);
}
