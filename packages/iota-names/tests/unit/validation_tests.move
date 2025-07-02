// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module iota_names::validation_tests;

use iota_names::core_config;
use iota_names::deny_list;
use iota_names::iota_names;
use iota_names::name;
use iota_names::validation;

#[test]
fun test_assert_not_blocked_or_reserved_success() {
    let mut ctx = tx_context::dummy();
    let (mut iota_names, cap) = iota_names::new_for_testing(&mut ctx);
    deny_list::setup(&mut iota_names, &cap, &mut ctx);
    
    // Test with a normal name that should not be blocked or reserved
    let name = name::new(b"test.iota".to_string());
    validation::assert_not_blocked_or_reserved(&iota_names, &name);
    
    // Clean up
    iota_names.share_for_testing();
    iota_names::burn_admin_cap_for_testing(cap);
}

#[test, expected_failure(abort_code = ::iota_names::validation::EBlockedName)]
fun test_assert_not_blocked_or_reserved_blocked_name() {
    let mut ctx = tx_context::dummy();
    let (mut iota_names, cap) = iota_names::new_for_testing(&mut ctx);
    iota_names.authorize_for_testing<deny_list::DenyListAuth>();

    // Setup deny list and block a name
    deny_list::setup(&mut iota_names, &cap, &mut ctx);
    deny_list::add_blocked_labels(&mut iota_names, &cap, vector[b"blocked".to_string()]);
    
    // Test with a blocked name - should abort
    let blocked_name = name::new(b"blocked.iota".to_string());
    validation::assert_not_blocked_or_reserved(&iota_names, &blocked_name);
    
    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names::validation::EReservedName)]
fun test_assert_not_blocked_or_reserved_reserved_name() {
    let mut ctx = tx_context::dummy();
    let (mut iota_names, cap) = iota_names::new_for_testing(&mut ctx);
    iota_names.authorize_for_testing<deny_list::DenyListAuth>();

    // Setup deny list and reserve a name
    deny_list::setup(&mut iota_names, &cap, &mut ctx);
    deny_list::add_reserved_labels(&mut iota_names, &cap, vector[b"reserved".to_string()]);
    
    // Test with a reserved name - should abort
    let reserved_name = name::new(b"reserved.iota".to_string());
    validation::assert_not_blocked_or_reserved(&iota_names, &reserved_name);
    
    abort 1337
}

#[test]
fun test_assert_is_valid_for_sale_success() {
    let mut ctx = tx_context::dummy();
    let (mut iota_names, cap) = iota_names::new_for_testing(&mut ctx);
    iota_names.authorize_for_testing<deny_list::DenyListAuth>();

    // Add core config and deny list
    let core_config = core_config::default();
    cap.add_config(&mut iota_names, core_config);
    deny_list::setup(&mut iota_names, &cap, &mut ctx);
    
    // Test with a valid name
    let valid_name = name::new(b"test.iota".to_string());
    let config = iota_names.get_config<core_config::CoreConfig>();
    validation::assert_is_valid_for_sale(config, &iota_names, &valid_name);
    
    // Clean up
    iota_names.share_for_testing();
    iota_names::burn_admin_cap_for_testing(cap);
}

#[test, expected_failure(abort_code = ::iota_names::validation::EBlockedName)]
fun test_assert_is_valid_for_sale_blocked_name() {
    let mut ctx = tx_context::dummy();
    let (mut iota_names, cap) = iota_names::new_for_testing(&mut ctx);
    iota_names.authorize_for_testing<deny_list::DenyListAuth>();
    
    // Add core config and deny list with blocked name
    let core_config = core_config::default();
    cap.add_config(&mut iota_names, core_config);
    deny_list::setup(&mut iota_names, &cap, &mut ctx);
    deny_list::add_blocked_labels(&mut iota_names, &cap, vector[b"blocked".to_string()]);
    
    // Test with a blocked name - should abort
    let blocked_name = name::new(b"blocked.iota".to_string());
    let config = iota_names.get_config<core_config::CoreConfig>();
    validation::assert_is_valid_for_sale(config, &iota_names, &blocked_name);
    
    abort 1337
}
