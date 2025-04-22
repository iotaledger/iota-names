// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module iota_names_discounts::discount_tests;

use iota::{clock, test_scenario::{Self as ts, Scenario, ctx}, test_utils::{destroy, assert_eq}};
use iota_names::{
    iota_names::{Self, IotaNames, AdminCap},
    payment::{Self, PaymentIntent},
    pricing_config::{Self, PricingConfig},
    registry
};
use iota_names_discounts::{discounts::{Self, RegularDiscountsApp}, house::{Self, DiscountHouse}};

// an authorized type to test.
public struct TestAuthorized has copy, drop, store {}

// another authorized type to test.
public struct AnotherAuthorized has copy, drop, store {}

// an unauthorized type to test.
public struct TestUnauthorized has copy, drop, store {}

const IOTANS_ADDRESS: address = @0xA001;
const USER_ADDRESS: address = @0xA002;
const NANOS_PER_IOTA: u64 = 1_000_000_000;

fun test_init(): Scenario {
    let mut scenario_val = ts::begin(IOTANS_ADDRESS);
    let scenario = &mut scenario_val;
    {
        let mut iota_names = iota_names::init_for_testing(scenario.ctx());
        iota_names.authorize_app_for_testing<RegularDiscountsApp>();
        iota_names.share_for_testing();
        house::init_for_testing(scenario.ctx());
        let clock = clock::create_for_testing(scenario.ctx());
        clock.share_for_testing();
    };
    {
        scenario.next_tx(IOTANS_ADDRESS);
        let admin_cap = scenario.take_from_sender<AdminCap>();
        let mut iota_names = scenario.take_shared<IotaNames>();
        let mut discount_house = scenario.take_shared<DiscountHouse>();

        // a more expensive alternative.
        discounts::authorize_type<TestAuthorized>(
            &mut discount_house,
            &admin_cap,
            test_config(false), // we get 5, 3, 2% discounts for 3, 4, 5+ chars.
        );
        // a much cheaper price for another type.
        discounts::authorize_type<AnotherAuthorized>(
            &mut discount_house,
            &admin_cap,
            test_config(
                true,
            ), // we get 50, 30, 20% discounts for 3, 4, 5+ chars.
        );

        registry::init_for_testing(&admin_cap, &mut iota_names, scenario.ctx());

        ts::return_shared(discount_house);
        ts::return_shared(iota_names);
        scenario.return_to_sender(admin_cap);
    };
    scenario_val
}

#[test]
fun test_e2e() {
    init_purchase!(USER_ADDRESS, b"fivel.iota", |discount_house, iota_names, intent, scenario| {
        assert_eq(
            intent.request_data().base_amount(),
            50 * NANOS_PER_IOTA,
        );

        discounts::apply_percentage_discount(
            discount_house,
            intent,
            iota_names,
            &mut TestAuthorized {},
            scenario.ctx(),
        );

        assert_eq(
            intent.request_data().base_amount(),
            40 * NANOS_PER_IOTA,
        );
        assert_eq(intent.request_data().discounts_applied().size(), 1);
        assert_eq(intent.request_data().any_discount_applied(), true);
    });
}

#[test, expected_failure(abort_code = ::iota_names_discounts::discounts::EConfigNotExists)]
fun register_with_unauthorized_type() {
    init_purchase!(USER_ADDRESS, b"fivel.iota", |discount_house, iota_names, intent, scenario| {
        discounts::apply_percentage_discount(
            discount_house,
            intent,
            iota_names,
            &mut TestUnauthorized {},
            scenario.ctx(),
        );
    });
}

macro fun init_purchase(
    $addr: address,
    $domain_name: vector<u8>,
    $f: |&mut DiscountHouse, &mut IotaNames, &mut PaymentIntent, &mut Scenario|,
) {
    let addr = $addr;
    let dm = $domain_name;

    let mut scenario = test_init();
    scenario.next_tx(addr);

    // take the discount house
    let mut discount_house = scenario.take_shared<DiscountHouse>();
    let mut iota_names = scenario.take_shared<IotaNames>();
    let mut intent = payment::init_registration(&mut iota_names, dm.to_string());

    $f(&mut discount_house, &mut iota_names, &mut intent, &mut scenario);

    destroy(intent);
    destroy(discount_house);
    destroy(iota_names);

    scenario.end();
}

fun test_config(is_large: bool): PricingConfig {
    let multiply = if (is_large) {
        3
    } else {
        1
    };

    pricing_config::new(
        vector[
            pricing_config::new_range(vector[3, 3]),
            pricing_config::new_range(vector[4, 4]),
            pricing_config::new_range(vector[5, 63]),
        ],
        vector[10 * multiply, 15 * multiply, 20 * multiply],
    )
}
