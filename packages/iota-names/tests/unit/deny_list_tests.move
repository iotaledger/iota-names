// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
#[allow(lint(abort_without_constant))]
module iota_names::deny_list_tests;

use iota_names::deny_list::{Self, DenyListAuth};
use iota::test_scenario::{Self as ts, Scenario};
use iota_names::iota_names::{Self, IotaNames};
use iota_names::name;
use std::string::{utf8, String};

const ADDR: address = @0x0;

#[test]
fun test() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    scenario.next_tx(ADDR);
    let mut iota_names = scenario.take_shared<IotaNames>();
    let cap = iota_names::create_admin_cap_for_testing(scenario.ctx());

    deny_list::add_reserved_labels(&mut iota_names, &cap, some_reserved_labels());
    deny_list::add_blocked_labels(&mut iota_names, &cap, some_blocked_labels());

    assert!(deny_list::is_reserved_name(&iota_names, &name::new(b"test.iota".to_string())), 0);
    assert!(deny_list::is_reserved_name(&iota_names, &name::new(b"test2.iota".to_string())), 0);

    assert!(deny_list::is_blocked_name(&iota_names, &name::new(b"badtest.iota".to_string())), 0);

    assert!(!deny_list::is_blocked_name(&iota_names, &name::new(b"example.iota".to_string())), 0);

    assert!(!deny_list::is_reserved_name(&iota_names, &name::new(b"example.iota".to_string())), 0);

    iota_names::burn_admin_cap_for_testing(cap);

    ts::return_shared(iota_names);
    scenario_val.end();
}

#[test, expected_failure(abort_code = ::iota_names::deny_list::ENoLabelsInList)]
fun test_empty_addition_reserved_failure() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    scenario.next_tx(ADDR);
    let mut iota_names = scenario.take_shared<IotaNames>();
    let cap = iota_names::create_admin_cap_for_testing(scenario.ctx());

    deny_list::add_reserved_labels(&mut iota_names, &cap, vector[]);

    abort 1337
}

// coverage.. :)
#[test, expected_failure(abort_code = ::iota_names::deny_list::ENoLabelsInList)]
fun test_empty_addition_blocked_failure() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    scenario.next_tx(ADDR);
    let mut iota_names = scenario.take_shared<IotaNames>();
    let cap = iota_names::create_admin_cap_for_testing(scenario.ctx());

    deny_list::add_blocked_labels(&mut iota_names, &cap, vector[]);

    abort 1337
}

#[test]
fun remove_blocked_label() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    scenario.next_tx(ADDR);
    let mut iota_names = scenario.take_shared<IotaNames>();
    let cap = iota_names::create_admin_cap_for_testing(scenario.ctx());

    deny_list::add_blocked_labels(&mut iota_names, &cap, some_blocked_labels());

    assert!(deny_list::is_blocked_name(&iota_names, &name::new(b"badtest.iota".to_string())), 0);

    deny_list::remove_blocked_names(&mut iota_names, &cap, vector[utf8(b"badtest")]);

    assert!(!deny_list::is_blocked_name(&iota_names, &name::new(b"badtest.iota".to_string())), 0);

    iota_names::burn_admin_cap_for_testing(cap);

    ts::return_shared(iota_names);
    scenario_val.end();
}

#[test]
fun remove_reserved_label() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    scenario.next_tx(ADDR);
    let mut iota_names = scenario.take_shared<IotaNames>();
    let cap = iota_names::create_admin_cap_for_testing(scenario.ctx());

    deny_list::add_reserved_labels(&mut iota_names, &cap, some_reserved_labels());

    let name = utf8(b"test");

    assert!(deny_list::is_reserved_name(&iota_names, &name::new(b"test.iota".to_string())), 0);

    deny_list::remove_reserved_labels(&mut iota_names, &cap, vector[name]);

    assert!(!deny_list::is_reserved_name(&iota_names, &name::new(b"test.iota".to_string())), 0);

    iota_names::burn_admin_cap_for_testing(cap);

    ts::return_shared(iota_names);
    scenario_val.end();
}

#[test, expected_failure(abort_code = ::iota_names::deny_list::ENoLabelsInList)]
fun tries_to_remove_no_labels() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    scenario.next_tx(ADDR);
    let mut iota_names = scenario.take_shared<IotaNames>();
    let cap = iota_names::create_admin_cap_for_testing(scenario.ctx());

    deny_list::add_reserved_labels(&mut iota_names, &cap, some_reserved_labels());

    let _name = utf8(b"test");

    assert!(deny_list::is_reserved_name(&iota_names, &name::new(b"test.iota".to_string())), 0);

    deny_list::remove_reserved_labels(&mut iota_names, &cap, vector[]);

    abort 1337
}

// data preparation

public fun test_init(): (Scenario) {
    let mut scenario = ts::begin(ADDR);
    {
        scenario.next_tx(ADDR);

        let (mut iota_names, cap) = iota_names::new_for_testing(scenario.ctx());

        iota_names.authorize_for_testing<DenyListAuth>();

        deny_list::setup(&mut iota_names, &cap, scenario.ctx());

        iota_names.share_for_testing();

        iota_names::burn_admin_cap_for_testing(cap);
    };

    scenario
}

fun some_reserved_labels(): vector<String> {
    let mut vec: vector<String> = vector::empty();

    vec.push_back(utf8(b"test"));
    vec.push_back(utf8(b"test2"));
    vec.push_back(utf8(b"test3"));
    vec
}

fun some_blocked_labels(): vector<String> {
    let mut vec: vector<String> = vector::empty();
    vec.push_back(utf8(b"badtest"));
    vec.push_back(utf8(b"badtest2"));
    vec.push_back(utf8(b"badtest3"));
    vec
}
