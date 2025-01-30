// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module coupons::setup;

use coupons::constants;
use coupons::coupon_house::{Self, CouponsApp};
use coupons::data::Data;
use coupons::range;
use coupons::rules;
use std::string::{utf8, String};
use iota::clock::{Self, Clock};
use iota::coin;
use iota::iota::IOTA;
use iota::test_scenario::{Self, Scenario, ctx};
use iotans::registry;
use iotans::iotans::{Self, AdminCap, IOTANS};

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
        let mut iotans = iotans::init_for_testing(scenario.ctx());
        iotans::authorize_app_for_testing<CouponsApp>(&mut iotans);
        iotans::share_for_testing(iotans);
        let clock = clock::create_for_testing(scenario.ctx());
        clock::share_for_testing(clock);
    };
    {
        scenario.next_tx(ADMIN_ADDRESS);
        // get admin cap
        let admin_cap = scenario.take_from_sender<AdminCap>();
        let mut iotans = scenario.take_shared<IOTANS>();
        // initialize coupon data.
        coupon_house::setup(&mut iotans, &admin_cap, scenario.ctx());
        registry::init_for_testing(&admin_cap, &mut iotans, scenario.ctx());
        // authorize TestApp to CouponHouse.
        coupon_house::authorize_app<TestApp>(&admin_cap, &mut iotans);
        test_scenario::return_to_sender(scenario, admin_cap);
        test_scenario::return_shared(iotans);
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
    // 5 IOTA DISCOUNT, ONLY CLAIMABLE TWICE
    coupon_house::app_add_coupon(
        data_mut,
        utf8(b"5_IOTA_DISCOUNT"),
        constants::fixed_price_discount_type(),
        5 * NANOS_PER_IOTA,
        rules::new_coupon_rules(
            option::none(),
            option::some(2),
            option::none(),
            option::none(),
            option::none(),
        ),
        ctx,
    );

    // 25% DISCOUNT, ONLY FOR 2 YEARS OR LESS REGISTRATIONS
    coupon_house::app_add_coupon(
        data_mut,
        utf8(b"25_PERCENT_DISCOUNT_MAX_2_YEARS"),
        constants::percentage_discount_type(),
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
        constants::percentage_discount_type(),
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
        constants::percentage_discount_type(),
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
        constants::percentage_discount_type(),
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
        constants::percentage_discount_type(),
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
        constants::percentage_discount_type(),
        50,
        rules::new_empty_rules(),
        ctx,
    );
    coupon_house::app_remove_coupon(data_mut, utf8(b"REMOVE_FOR_COVERAGE"));
}

// Adds a 0 rule coupon that gives 15% discount to test admin additions.
public fun admin_add_coupon(
    code_name: String,
    kind: u8,
    value: u64,
    scenario: &mut Scenario,
) {
    scenario.next_tx(admin());
    let mut iotans = scenario.take_shared<IOTANS>();
    let cap = scenario.take_from_sender<AdminCap>();
    coupon_house::admin_add_coupon(
        &cap,
        &mut iotans,
        code_name,
        kind,
        value,
        rules::new_empty_rules(),
        scenario.ctx(),
    );
    scenario.return_to_sender(cap);
    test_scenario::return_shared(iotans);
}

// Adds a 0 rule coupon that gives 15% discount to test admin additions.
public fun admin_remove_coupon(code_name: String, scenario: &mut Scenario) {
    scenario.next_tx(admin());
    let mut iotans = scenario.take_shared<IOTANS>();
    let cap = scenario.take_from_sender<AdminCap>();
    coupon_house::admin_remove_coupon(
        &cap,
        &mut iotans,
        code_name,
    );
    scenario.return_to_sender(cap);
    test_scenario::return_shared(iotans);
}

// Internal helper that tries to claim a name using a coupon.
// Test prices are:
// 3 digit -> 1200
// 4 digit -> 200
// 5 digit -> 50
// A helper to easily register a name with a coupon code.
public fun register_with_coupon(
    coupon_code: String,
    domain_name: String,
    no_years: u8,
    amount: u64,
    clock_value: u64,
    user: address,
    scenario: &mut Scenario,
) {
    scenario.next_tx(user);
    let mut clock = scenario.take_shared<Clock>();
    clock.increment_for_testing(clock_value);
    let mut iotans = scenario.take_shared<IOTANS>();

    let payment = coin::mint_for_testing<IOTA>(amount, scenario.ctx());

    let nft = coupon_house::register_with_coupon(
        &mut iotans,
        coupon_code,
        domain_name,
        no_years,
        payment,
        &clock,
        scenario.ctx(),
    );

    transfer::public_transfer(nft, user);
    test_scenario::return_shared(iotans);
    test_scenario::return_shared(clock);
}
