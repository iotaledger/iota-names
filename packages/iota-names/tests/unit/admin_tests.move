// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
#[allow(lint(abort_without_constant))]
/// Testing strategy:
///
/// - Admin can add new records to IotaNames and get the IotaNamesRegistrations
/// for the registered names.
/// - Admin keeps the registration NFTs at their account for now.
///
module iota_names::admin_tests;

use iota::clock;
use iota::test_utils::assert_eq;
use iota_names::admin::{Self, AdminAuth};
use iota_names::constants;
use iota_names::deny_list;
use iota_names::name;
use iota_names::registry;
use iota_names::iota_names::{Self, IotaNames, AdminCap};
use iota_names::iota_names_registration::IotaNamesRegistration;
use iota_names::test_init_utils;
use std::string::{utf8, String};

#[test, expected_failure(abort_code = ::iota_names::iota_names::EAppNotAuthorized)]
fun try_unauthorized_fail() {
    let mut ctx = tx_context::dummy();
    let mut iota_names = iota_names::init_for_testing(&mut ctx);
    let cap = iota_names::create_admin_cap_for_testing(&mut ctx);
    let clock = clock::create_for_testing(&mut ctx);
    test_init_utils::setup_for_testing(&mut iota_names, &cap, &mut ctx);

    let _nft = admin::register_name(
        &cap,
        &mut iota_names,
        utf8(b"test.iota"),
        1,
        &clock,
        &mut ctx,
    );

    abort 1337
}

#[test]
fun authorized() {
    let mut ctx = tx_context::dummy();
    let mut iota_names = iota_names::init_for_testing(&mut ctx);
    let cap = iota_names::create_admin_cap_for_testing(&mut ctx);
    let clock = clock::create_for_testing(&mut ctx);
    test_init_utils::setup_for_testing(&mut iota_names, &cap, &mut ctx);

    iota_names::authorize_for_testing<AdminAuth>(&mut iota_names);

    let nft = admin::register_name(
        &cap,
        &mut iota_names,
        utf8(b"test.iota"),
        1,
        &clock,
        &mut ctx,
    );

    assert_eq(nft.name(), name::new(utf8(b"test.iota")));
    assert_eq(nft.expiration_timestamp_ms(), constants::year_ms());

    nft.burn_for_testing();
    clock.destroy_for_testing();
    iota_names::burn_admin_cap_for_testing(cap);
    iota_names::share_for_testing(iota_names);
}

#[test]
fun register_name_from_deny_list() {
    let mut ctx = tx_context::dummy();
    let mut iota_names = iota_names::init_for_testing(&mut ctx);
    let cap = iota_names::create_admin_cap_for_testing(&mut ctx);
    let clock = clock::create_for_testing(&mut ctx);
    test_init_utils::setup_for_testing(&mut iota_names, &cap, &mut ctx);

    iota_names::authorize_for_testing<AdminAuth>(&mut iota_names);

    let mut reserved_labels: vector<String> = vector::empty();
    reserved_labels.push_back(utf8(b"test"));
    deny_list::add_reserved_labels(&mut iota_names, &cap, reserved_labels);

    let nft = admin::register_name(
        &cap,
        &mut iota_names,
        utf8(b"test.iota"),
        1,
        &clock,
        &mut ctx,
    );

    assert_eq(nft.name(), name::new(utf8(b"test.iota")));
    assert_eq(nft.expiration_timestamp_ms(), constants::year_ms());

    nft.burn_for_testing();
    clock.destroy_for_testing();
    iota_names::burn_admin_cap_for_testing(cap);
    iota_names::share_for_testing(iota_names);
}

#[test]
fun register_names_from_deny_list() {
    let ctx = tx_context::dummy();
    let mut scenario = iota::test_scenario::begin(ctx.sender());

    {
        let iota_names = iota_names::init_for_testing(scenario.ctx());
        iota_names.share_for_testing();
    };

    let names = vector[
        utf8(b"one.iota"),
        utf8(b"two.iota"),
    ];
    
    {
        scenario.next_tx(ctx.sender());

        let mut iota_names = scenario.take_shared<IotaNames>();
        let admin_cap = scenario.take_from_sender<AdminCap>();
        let clock = clock::create_for_testing(scenario.ctx());
        
        test_init_utils::setup_for_testing(&mut iota_names, &admin_cap, scenario.ctx());

        iota_names::authorize_for_testing<AdminAuth>(&mut iota_names);

        let reserved_labels = vector[
            utf8(b"one"),
            utf8(b"two"),
        ];
        deny_list::add_reserved_labels(&mut iota_names, &admin_cap, reserved_labels);

        admin::register_names(
            &admin_cap,
            &mut iota_names,
            copy names,
            1,
            &clock,
            scenario.ctx()
        );

        clock.share_for_testing();
        scenario.return_to_sender(admin_cap);
        iota::test_scenario::return_shared(iota_names);
    };

    {
        scenario.next_tx(ctx.sender());

        let mut ids = scenario.ids_for_sender<IotaNamesRegistration>();
        assert_eq(ids.length(), names.length());
        while (!ids.is_empty()) {
            let nft = scenario.take_from_sender_by_id<IotaNamesRegistration>(ids.pop_back());
            assert!(vector::contains(&names, &nft.name_str()));
            assert_eq(nft.expiration_timestamp_ms(), constants::year_ms());
            scenario.return_to_sender(nft);
        };
    };

    scenario.end();
}

#[test]
fun register_multiple() {
    let ctx = tx_context::dummy();
    let mut scenario = iota::test_scenario::begin(ctx.sender());

    {
        let iota_names = iota_names::init_for_testing(scenario.ctx());
        iota_names.share_for_testing();
    };

    let names = vector[
        utf8(b"name1.iota"),
        utf8(b"name2.iota"),
        utf8(b"name3.iota"),
        utf8(b"name4.iota")
    ];
    
    {
        scenario.next_tx(ctx.sender());

        let mut iota_names = scenario.take_shared<IotaNames>();
        let admin_cap = scenario.take_from_sender<AdminCap>();
        let clock = clock::create_for_testing(scenario.ctx());
        
        test_init_utils::setup_for_testing(&mut iota_names, &admin_cap, scenario.ctx());

        iota_names::authorize_for_testing<AdminAuth>(&mut iota_names);

        admin::register_names(
            &admin_cap,
            &mut iota_names,
            copy names,
            1,
            &clock,
            scenario.ctx()
        );

        clock.share_for_testing();
        scenario.return_to_sender(admin_cap);
        iota::test_scenario::return_shared(iota_names);
    };

    {
        scenario.next_tx(ctx.sender());

        let mut ids = scenario.ids_for_sender<IotaNamesRegistration>();
        assert_eq(ids.length(), names.length());
        while (!ids.is_empty()) {
            let nft = scenario.take_from_sender_by_id<IotaNamesRegistration>(ids.pop_back());
            assert!(vector::contains(&names, &nft.name_str()));
            assert_eq(nft.expiration_timestamp_ms(), constants::year_ms());
            scenario.return_to_sender(nft);
        };
    };

    scenario.end();
}

#[test]
fun test_admin_remove_existing_records() {
    let ctx = tx_context::dummy();
    let mut scenario = iota::test_scenario::begin(ctx.sender());

    {
        let iota_names = iota_names::init_for_testing(scenario.ctx());
        iota_names.share_for_testing();
    };

    let names_to_register = vector[
        utf8(b"name1.iota"),
        utf8(b"name2.iota"),
        utf8(b"name3.iota"),
    ];
    
    // Register the names first
    {
        scenario.next_tx(ctx.sender());

        let mut iota_names = scenario.take_shared<IotaNames>();
        let admin_cap = scenario.take_from_sender<AdminCap>();
        let clock = clock::create_for_testing(scenario.ctx());
        
        test_init_utils::setup_for_testing(&mut iota_names, &admin_cap, scenario.ctx());
        iota_names::authorize_for_testing<AdminAuth>(&mut iota_names);

        // Register names
        admin::register_names(
            &admin_cap,
            &mut iota_names,
            copy names_to_register,
            1,
            &clock,
            scenario.ctx()
        );

        clock.share_for_testing();
        scenario.return_to_sender(admin_cap);
        iota::test_scenario::return_shared(iota_names);
    };

    // Verify names exist before removal
    {
        scenario.next_tx(ctx.sender());
        let iota_names = scenario.take_shared<IotaNames>();
        let registry = iota_names.registry<registry::Registry>();
        
        let mut i = 0;
        while (i < names_to_register.length()) {
            let name = name::new(names_to_register[i]);
            assert!(registry.has_record(name), 0);
            i = i + 1;
        };

        iota::test_scenario::return_shared(iota_names);
    };

    // Remove the names using admin_remove_records
    {
        scenario.next_tx(ctx.sender());

        let mut iota_names = scenario.take_shared<IotaNames>();
        let admin_cap = scenario.take_from_sender<AdminCap>();

        admin::admin_remove_records(
            &admin_cap,
            &mut iota_names,
            names_to_register,
        );

        scenario.return_to_sender(admin_cap);
        iota::test_scenario::return_shared(iota_names);
    };

    // Verify names are removed
    {
        scenario.next_tx(ctx.sender());
        let iota_names = scenario.take_shared<IotaNames>();
        let registry = iota_names.registry<registry::Registry>();
        
        let mut i = 0;
        while (i < names_to_register.length()) {
            let name = name::new(names_to_register[i]);
            assert!(!registry.has_record(name), 0);
            i = i + 1;
        };

        iota::test_scenario::return_shared(iota_names);
    };

    scenario.end();
}

#[test]
fun test_admin_remove_mixed_records() {
    let ctx = tx_context::dummy();
    let mut scenario = iota::test_scenario::begin(ctx.sender());

    {
        let iota_names = iota_names::init_for_testing(scenario.ctx());
        iota_names.share_for_testing();
    };

    let existing_names = vector[
        utf8(b"existing1.iota"),
        utf8(b"existing2.iota"),
    ];
    
    let mixed_names = vector[
        utf8(b"existing1.iota"),
        utf8(b"existing2.iota"),
        utf8(b"nonexistent1.iota"),
        utf8(b"nonexistent2.iota"),
    ];
    
    // Register only some names
    {
        scenario.next_tx(ctx.sender());

        let mut iota_names = scenario.take_shared<IotaNames>();
        let admin_cap = scenario.take_from_sender<AdminCap>();
        let clock = clock::create_for_testing(scenario.ctx());
        
        test_init_utils::setup_for_testing(&mut iota_names, &admin_cap, scenario.ctx());
        iota_names::authorize_for_testing<AdminAuth>(&mut iota_names);

        admin::register_names(
            &admin_cap,
            &mut iota_names,
            copy existing_names,
            1,
            &clock,
            scenario.ctx()
        );

        clock.share_for_testing();
        scenario.return_to_sender(admin_cap);
        iota::test_scenario::return_shared(iota_names);
    };

    // Verify initial state - existing names exist, non-existing don't
    {
        scenario.next_tx(ctx.sender());
        let iota_names = scenario.take_shared<IotaNames>();
        let registry = iota_names.registry<registry::Registry>();
        
        assert!(registry.has_record(name::new(utf8(b"existing1.iota"))), 0);
        assert!(registry.has_record(name::new(utf8(b"existing2.iota"))), 0);
        
        assert!(!registry.has_record(name::new(utf8(b"nonexistent1.iota"))), 0);
        assert!(!registry.has_record(name::new(utf8(b"nonexistent2.iota"))), 0);

        iota::test_scenario::return_shared(iota_names);
    };

    // Remove mixed names (existing and non-existing)
    {
        scenario.next_tx(ctx.sender());

        let mut iota_names = scenario.take_shared<IotaNames>();
        let admin_cap = scenario.take_from_sender<AdminCap>();

        // This should handle mixed names gracefully - remove existing ones, ignore non-existing
        admin::admin_remove_records(
            &admin_cap,
            &mut iota_names,
            mixed_names,
        );

        scenario.return_to_sender(admin_cap);
        iota::test_scenario::return_shared(iota_names);
    };

    // Verify final state - all names should be removed/not exist
    {
        scenario.next_tx(ctx.sender());
        let iota_names = scenario.take_shared<IotaNames>();
        let registry = iota_names.registry<registry::Registry>();
        
        let mut i = 0;
        while (i < mixed_names.length()) {
            let name = name::new(mixed_names[i]);
            assert!(!registry.has_record(name), 0);
            i = i + 1;
        };

        iota::test_scenario::return_shared(iota_names);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = ::iota_names::admin::ENoNamesProvided)]
fun test_register_names_empty_list_fails() {
    let ctx = tx_context::dummy();
    let mut scenario = iota::test_scenario::begin(ctx.sender());

    {
        let iota_names = iota_names::init_for_testing(scenario.ctx());
        iota_names.share_for_testing();
    };

    {
        scenario.next_tx(ctx.sender());

        let mut iota_names = scenario.take_shared<IotaNames>();
        let admin_cap = scenario.take_from_sender<AdminCap>();
        let clock = clock::create_for_testing(scenario.ctx());
        
        test_init_utils::setup_for_testing(&mut iota_names, &admin_cap, scenario.ctx());
        iota_names::authorize_for_testing<AdminAuth>(&mut iota_names);

        // Try to register an empty list of names - this should fail
        admin::register_names(
            &admin_cap,
            &mut iota_names,
            vector::empty<std::string::String>(),
            1,
            &clock,
            scenario.ctx()
        );

        clock.share_for_testing();
        scenario.return_to_sender(admin_cap);
        iota::test_scenario::return_shared(iota_names);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = ::iota_names::admin::ENoNamesProvided)]
fun test_admin_remove_empty_records() {
    let mut ctx = tx_context::dummy();
    let (mut iota_names, admin_cap) = iota_names::new_for_testing(&mut ctx);
    let clock = clock::create_for_testing(&mut ctx);
    test_init_utils::setup_for_testing(&mut iota_names, &admin_cap, &mut ctx);
    iota_names::authorize_for_testing<AdminAuth>(&mut iota_names);

    // Test removing records with empty vector
    let empty_names: vector<String> = vector::empty();
    admin::admin_remove_records(&admin_cap, &mut iota_names, empty_names);

    // Clean up
    clock.destroy_for_testing();
    iota_names.share_for_testing();
    iota_names::burn_admin_cap_for_testing(admin_cap);
}

#[test]
fun test_admin_remove_missing_records() {
    let mut ctx = tx_context::dummy();
    let (mut iota_names, admin_cap) = iota_names::new_for_testing(&mut ctx);
    let clock = clock::create_for_testing(&mut ctx);
    test_init_utils::setup_for_testing(&mut iota_names, &admin_cap, &mut ctx);
    iota_names::authorize_for_testing<AdminAuth>(&mut iota_names);

    // Test removing non-existent records
    let non_existent_names = vector[
        utf8(b"nonexistent1.iota"),
        utf8(b"nonexistent2.iota"),
    ];
    admin::admin_remove_records(&admin_cap, &mut iota_names, non_existent_names);

    // Clean up
    clock.destroy_for_testing();
    iota_names.share_for_testing();
    iota_names::burn_admin_cap_for_testing(admin_cap);
}
