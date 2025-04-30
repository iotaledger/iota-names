// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
#[allow(lint(abort_without_constant))]
///
module iota_names::iota_names_tests;

use iota::balance;
use iota::coin;
use iota::iota::IOTA;
use iota::test_utils::assert_eq;
use iota_names::iota_names::{Self, AdminCap, IotaNames};

// === Config management ===

public struct TestConfig has drop, store { a: u8 }
public struct USDC has drop {}

#[test]
/// Add a configuration; get it back; remove it.
fun config_management() {
    let mut ctx = tx_context::dummy();
    let (mut iota_names, cap) = iota_names::new_for_testing(&mut ctx);

    iota_names::add_config(&cap, &mut iota_names, TestConfig { a: 1 });
    let _cfg = iota_names.get_config<TestConfig>();
    let cfg = iota_names::remove_config<TestConfig>(&cap, &mut iota_names);
    assert_eq(cfg.a, 1);

    wrapup(iota_names, cap);
}

// === Registry ===

public struct TestRegistry has store { counter: u8 }

#[test]
/// Add a registry; read it.
fun registry_management() {
    let mut ctx = tx_context::dummy();
    let (mut iota_names, cap) = iota_names::new_for_testing(&mut ctx);

    iota_names::add_registry(&cap, &mut iota_names, TestRegistry { counter: 1 });
    let reg = iota_names.registry<TestRegistry>();
    assert_eq(reg.counter, 1);

    wrapup(iota_names, cap);
}

// === Application Auth ===

public struct TestAuth has drop {}

#[test, expected_failure(abort_code = ::iota_names::iota_names::EAppNotAuthorized)]
/// Only authorized applications can add balance to IotaNames.
fun auth_add_to_balance_fail() {
    let mut ctx = tx_context::dummy();
    let (mut iota_names, _cap) = iota_names::new_for_testing(&mut ctx);
    iota_names.auth_add_balance<TestAuth, IOTA>(TestAuth {}, balance::zero());
    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names::iota_names::EAppNotAuthorized)]
/// Only authorized applications can access the registry mut.
fun auth_registry_mut_fail() {
    let mut ctx = tx_context::dummy();
    let (mut iota_names, _cap) = iota_names::new_for_testing(&mut ctx);
    iota_names::auth_registry_mut<TestAuth, TestRegistry>(TestAuth {}, &mut iota_names);
    abort 1337
}

#[test]
fun balance_and_withdraw() {
    let mut ctx = tx_context::dummy();
    let (mut iota_names, cap) = iota_names::new_for_testing(&mut ctx);
    iota_names::authorize<TestAuth>(&cap, &mut iota_names);

    let paid = balance::create_for_testing<IOTA>(1000);
    iota_names.auth_add_balance<TestAuth, IOTA>(TestAuth {}, paid);

    let withdrawn = iota_names.withdraw<IOTA>(&cap, &mut ctx);
    assert_eq(coin::burn_for_testing(withdrawn), 1000);

    wrapup(iota_names, cap);
}

#[test, expected_failure(abort_code = ::iota_names::iota_names::ENoProfitsInCoinType)]
/// 1. Authorize TestAuth and add to balance;
/// 2. Admin tries to withdraw an empty balance (other coin).
fun balance_and_withdraw_fail_no_profits_in_type() {
    let mut ctx = tx_context::dummy();
    let (mut iota_names, cap) = iota_names::new_for_testing(&mut ctx);
    iota_names::authorize<TestAuth>(&cap, &mut iota_names);

    let paid = balance::create_for_testing<IOTA>(1000);
    iota_names.auth_add_balance<TestAuth, IOTA>(TestAuth {}, paid);
    let _withdrawn = iota_names.withdraw<USDC>(&cap, &mut ctx);

    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names::iota_names::ENoProfitsInCoinType)]
/// Admin tries to withdraw an empty balance.
fun balance_and_withdraw_fail_no_profits() {
    let mut ctx = tx_context::dummy();
    let (mut iota_names, cap) = iota_names::new_for_testing(&mut ctx);
    let _withdrawn = iota_names.withdraw<IOTA>(&cap, &mut ctx);

    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names::iota_names::ENoProfitsInCoinType)]
/// 1. Authorize TestAuth and add 0 balance;
/// 2. Admin tries to withdraw from 0 balance.
fun balance_and_withdraw_fail_no_profits2() {
    let mut ctx = tx_context::dummy();
    let (mut iota_names, cap) = iota_names::new_for_testing(&mut ctx);
    iota_names::authorize<TestAuth>(&cap, &mut iota_names);

    // Add 0 balance
    let paid = balance::create_for_testing<IOTA>(0);
    iota_names.auth_add_balance<TestAuth, IOTA>(TestAuth {}, paid);

    let _withdrawn = iota_names.withdraw<IOTA>(&cap, &mut ctx);

    abort 1337
}

// === Helpers ===

// for a softer and simpler wrapup we can just share the object
fun wrapup(iota_names: IotaNames, cap: AdminCap) {
    iota_names.share_for_testing();
    iota_names::burn_admin_cap_for_testing(cap);
}
