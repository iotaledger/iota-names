// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

// A set of tests for the authorization of different apps in the CouponHouse.
#[test_only]
#[allow(lint(abort_without_constant))]
module iota_names_coupons::app_authorization_tests;

use iota::test_scenario::{return_shared, return_to_sender, end};
use iota_names::iota_names::IotaNames;
use iota_names_coupons::coupon_house::{Self, deauthorize};
use iota_names_coupons::setup::{Self, TestApp, admin, user, test_init};

#[test]
fun admin_get_app_success() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    // auth style as authorized app
    {
        scenario.next_tx(user());
        let mut iota_names = scenario.take_shared<IotaNames>();
        coupon_house::app_coupons_mut<TestApp>(&mut iota_names, setup::test_app());
        return_shared(iota_names);
    };

    end(scenario_val);
}

#[test]
fun authorized_app_get_app_success() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    {
        scenario.next_tx(admin());

        let mut coupon_house = scenario.take_shared();
        let admin_cap = scenario.take_from_sender();

        // test app deauthorization.
        deauthorize<TestApp>(&admin_cap, &mut coupon_house);

        // test that the app is indeed non authorized
        assert!(!coupon_house.is_authorized<TestApp>(), 0);

        return_to_sender(scenario, admin_cap);
        return_shared(coupon_house);
    };
    end(scenario_val);
}

#[test, expected_failure(abort_code = ::iota_names_coupons::coupon_house::EAppNotAuthorized)]
fun unauthorized_app_failure() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    {
        scenario.next_tx(user());
        let mut iota_names = scenario.take_shared<IotaNames>();
        coupon_house::app_coupons_mut(&mut iota_names, setup::unauthorized_test_app());
        return_shared(iota_names);
    };
    end(scenario_val);
}
