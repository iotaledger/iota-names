// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
///
module iotans::iotans_tests;

use iota::balance;
use iota::coin;
use iota::iota::IOTA;
use iota::test_utils::assert_eq;
use iotans::iotans::{Self, AdminCap, IotaNS};

// === Config management ===

public struct TestConfig has store, drop { a: u8 }

#[test]
/// Add a configuration; get it back; remove it.
fun config_management() {
    let mut ctx = tx_context::dummy();
    let (mut iotans, cap) = iotans::new_for_testing(&mut ctx);

    iotans::add_config(&cap, &mut iotans, TestConfig { a: 1 });
    let _cfg = iotans.get_config<TestConfig>();
    let cfg = iotans::remove_config<TestConfig>(&cap, &mut iotans);
    assert_eq(cfg.a, 1);

    wrapup(iotans, cap);
}

// === Registry ===

public struct TestRegistry has store { counter: u8 }

#[test]
/// Add a registry; read it.
fun registry_management() {
    let mut ctx = tx_context::dummy();
    let (mut iotans, cap) = iotans::new_for_testing(&mut ctx);

    iotans::add_registry(&cap, &mut iotans, TestRegistry { counter: 1 });
    let reg = iotans.registry<TestRegistry>();
    assert_eq(reg.counter, 1);

    wrapup(iotans, cap);
}

// === Application Auth ===

public struct TestApp has drop {}

#[test, expected_failure(abort_code = ::iotans::iotans::EAppNotAuthorized)]
/// Only authorized applications can add balance to IotaNS.
fun app_add_to_balance_fail() {
    let mut ctx = tx_context::dummy();
    let (mut iotans, _cap) = iotans::new_for_testing(&mut ctx);
    iotans::app_add_balance(TestApp {}, &mut iotans, balance::zero());
    abort 1337
}

#[test, expected_failure(abort_code = ::iotans::iotans::EAppNotAuthorized)]
/// Only authorized applications can access the registry mut.
fun app_registry_mut_fail() {
    let mut ctx = tx_context::dummy();
    let (mut iotans, _cap) = iotans::new_for_testing(&mut ctx);
    iotans::app_registry_mut<TestApp, TestRegistry>(TestApp {}, &mut iotans);
    abort 1337
}

#[test]
/// 1. Authorize TestApp;
/// 2. Adds balance to IotaNS, access registry mut.
fun authorize_and_access() {
    let mut ctx = tx_context::dummy();
    let (mut iotans, cap) = iotans::new_for_testing(&mut ctx);
    iotans::add_registry(&cap, &mut iotans, TestRegistry { counter: 1 });

    // authorize and check right away
    iotans::authorize_app<TestApp>(&cap, &mut iotans);
    assert!(iotans.is_app_authorized<TestApp>(), 0);
    iotans.assert_app_is_authorized<TestApp>();

    // add balance and read registry
    iotans::app_add_balance(TestApp {}, &mut iotans, balance::zero());
    let registry = iotans::app_registry_mut<TestApp, TestRegistry>(
        TestApp {},
        &mut iotans,
    );
    registry.counter = 2;

    // now read the registry again
    assert_eq(iotans.registry<TestRegistry>().counter, 2);

    // deauthorize application
    iotans::deauthorize_app<TestApp>(&cap, &mut iotans);
    assert!(!iotans.is_app_authorized<TestApp>(), 0);

    wrapup(iotans, cap);
}

#[test]
/// 1. Authorize TestApp and add to balance;
/// 2. Admin withdraws the balance.
fun balance_and_withdraw() {
    let mut ctx = tx_context::dummy();
    let (mut iotans, cap) = iotans::new_for_testing(&mut ctx);
    iotans::authorize_app<TestApp>(&cap, &mut iotans);

    let paid = balance::create_for_testing<IOTA>(1000);
    iotans::app_add_balance(TestApp {}, &mut iotans, paid);

    let withdrawn = iotans::withdraw(&cap, &mut iotans, &mut ctx);
    assert_eq(coin::burn_for_testing(withdrawn), 1000);

    wrapup(iotans, cap);
}

#[test, expected_failure(abort_code = ::iotans::iotans::ENoProfits)]
/// 1. Authorize TestApp and add to balance;
/// 2. Admin tries to withdraw an empty balance.
fun balance_and_withdraw_fail_no_profits() {
    let mut ctx = tx_context::dummy();
    let (mut iotans, cap) = iotans::new_for_testing(&mut ctx);
    let _withdrawn = iotans::withdraw(&cap, &mut iotans, &mut ctx);

    abort 1337
}

// === Helpers ===

// for a softer and simpler wrapup we can just share the object
fun wrapup(iotans: IotaNS, cap: AdminCap) {
    iotans.share_for_testing();
    iotans::burn_admin_cap_for_testing(cap);
}
