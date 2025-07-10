// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
#[allow(lint(abort_without_constant))]
module iota_names_subnames::subname_tests;

use iota::clock::{Self, Clock};
use iota::test_scenario::{Self as ts, Scenario, ctx};
use iota_names::constants::{grace_period_ms, year_ms};
use iota_names::controller::{Self, ControllerAuth};
use iota_names::deny_list::{Self, DenyListAuth};
use iota_names::name;
use iota_names::iota_names::{Self, IotaNames, AdminCap};
use iota_names::name_registration::{Self, NameRegistration};
use iota_names::registry::{Self, Registry};
use iota_names::registry_tests::burn_nfts;
use iota_names::subname_registration::{Self, SubnameRegistration};
use std::string::{String, utf8};
use iota_names_subnames::config;
use iota_names_subnames::subnames::{Self, SubnamesAuth};

const USER_ADDRESS: address = @0x01;
const TEST_ADDRESS: address = @0x02;

const MIN_SUBNAME_DURATION: u64 = 24 * 60 * 60 * 1000; // 1 day

#[test]
/// A test scenario
fun test_multiple_operation_cases() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let parent = create_sln(utf8(b"test.iota"), scenario);

    let mut child = create_node_subname(
        &parent,
        utf8(b"node.test.iota"),
        MIN_SUBNAME_DURATION,
        true,
        true,
        scenario,
    );

    create_leaf_subname(&parent, utf8(b"leaf.test.iota"), TEST_ADDRESS, scenario);
    remove_leaf_subname(&parent, utf8(b"leaf.test.iota"), scenario);

    // Create a node name with the same name as the leaf that was deleted.
    let another_child = create_node_subname(
        &parent,
        utf8(b"leaf.test.iota"),
        MIN_SUBNAME_DURATION,
        true,
        true,
        scenario,
    );

    let nested = create_node_subname(
        subname_registration::nft(&child),
        utf8(b"nested.node.test.iota"),
        MIN_SUBNAME_DURATION,
        true,
        true,
        scenario,
    );

    // extend node's subname expiration to the limit.
    extend_node_subname(
        &mut child,
        name_registration::expiration_timestamp_ms(&parent),
        scenario,
    );

    // update subname's setup for testing
    update_subname_setup(&parent, utf8(b"node.test.iota"), false, false, scenario);

    increment_clock(year_ms() +1, scenario);

    burn_subname(child, scenario);
    burn_subname(nested, scenario);
    burn_subname(another_child, scenario);

    burn_nfts(vector[parent]);
    ts::end(scenario_val);
}

#[test, expected_failure(abort_code = ::iota_names_subnames::subnames::EInvalidExpirationDate)]
fun expiration_past_parents_expiration() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    let parent = create_sln(utf8(b"test.iota"), scenario);

    let _child = create_node_subname(
        &parent,
        utf8(b"node.test.iota"),
        name_registration::expiration_timestamp_ms(&parent) + 1,
        true,
        true,
        scenario,
    );

    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names_subnames::config::EInvalidParent)]
/// tries to create a child node using an invalid parent.
fun invalid_parent_failure() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    let parent = create_sln(utf8(b"test.iota"), scenario);

    let _child = create_node_subname(
        &parent,
        utf8(b"node.example.iota"),
        name_registration::expiration_timestamp_ms(&parent),
        true,
        true,
        scenario,
    );

    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names_subnames::subnames::ECreationDisabledForSubname)]
fun tries_to_create_subname_with_disallowed_node_parent() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    let parent = create_sln(utf8(b"test.iota"), scenario);

    let child = create_node_subname(
        &parent,
        utf8(b"node.test.iota"),
        name_registration::expiration_timestamp_ms(&parent),
        false,
        true,
        scenario,
    );

    let child_nft = subname_registration::nft(&child);
    let _nested = create_node_subname(
        child_nft,
        utf8(b"test.node.test.iota"),
        name_registration::expiration_timestamp_ms(child_nft),
        false,
        true,
        scenario,
    );

    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names_subnames::subnames::EExtensionDisabledForSubname)]
fun tries_to_extend_without_permissions() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    let parent = create_sln(utf8(b"test.iota"), scenario);

    let mut child = create_node_subname(
        &parent,
        utf8(b"node.test.iota"),
        MIN_SUBNAME_DURATION,
        false,
        false,
        scenario,
    );

    extend_node_subname(&mut child, 2, scenario);

    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names_subnames::subnames::ESubnameReplaced)]
fun tries_to_extend_with_burned_parent() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    let parent = create_sln(utf8(b"test.iota"), scenario);

    let mut child = create_node_subname(
        &parent,
        utf8(b"node.test.iota"),
        MIN_SUBNAME_DURATION,
        true,
        true,
        scenario,
    );

    // Update time to ensure child is expired
    increment_clock(
        name_registration::expiration_timestamp_ms(&parent) + grace_period_ms() + 1,
        scenario,
    );

    ts::next_tx(scenario, TEST_ADDRESS);
    let mut iota_names = ts::take_shared<IotaNames>(scenario);
    let clock = ts::take_shared<Clock>(scenario);
    controller::burn_expired(&mut iota_names, parent, &clock);
    ts::return_shared(iota_names);
    ts::return_shared(clock);

    // any extension.
    extend_node_subname(&mut child, 2, scenario);

    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names_subnames::subnames::EParentChanged)]
fun tries_to_extend_while_parent_changed() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    let parent = create_sln(utf8(b"test.iota"), scenario);

    // child is an expired name ofc.
    let mut child = create_node_subname(
        &parent,
        utf8(b"node.test.iota"),
        MIN_SUBNAME_DURATION,
        true,
        true,
        scenario,
    );

    // Update time to ensure child is expired
    increment_clock(
        name_registration::expiration_timestamp_ms(&parent) + grace_period_ms() + 1,
        scenario,
    );

    let _parent_w_different_owner = create_sln(utf8(b"test.iota"), scenario);

    // any extension.
    extend_node_subname(&mut child, 2, scenario);

    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names_subnames::subnames::EInvalidExpirationDate)]
fun tries_to_extend_with_too_long_date() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    let parent = create_sln(utf8(b"test.iota"), scenario);

    // child is an expired name ofc.
    let mut child = create_node_subname(
        &parent,
        utf8(b"node.test.iota"),
        MIN_SUBNAME_DURATION,
        true,
        true,
        scenario,
    );

    // Update time to ensure child is expired
    increment_clock(
        name_registration::expiration_timestamp_ms(&parent) + grace_period_ms() + 1,
        scenario,
    );

    extend_node_subname(&mut child, MIN_SUBNAME_DURATION + 24 * 60 * 60 * 1000 * 366, scenario);

    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names_subnames::subnames::EInvalidExpirationDate)]
fun tries_to_extend_with_too_short_date() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    let parent = create_sln(utf8(b"test.iota"), scenario);

    // child is an expired name ofc.
    let mut child = create_node_subname(
        &parent,
        utf8(b"node.test.iota"),
        MIN_SUBNAME_DURATION,
        true,
        true,
        scenario,
    );

    // Update time to ensure child is expired
    increment_clock(
        name_registration::expiration_timestamp_ms(&parent) + grace_period_ms() + 1,
        scenario,
    );

    extend_node_subname(&mut child, 1, scenario);

    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names::registry::ERecordExpired)]
fun tries_to_use_expired_subname_to_create_new() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    let parent = create_sln(utf8(b"test.iota"), scenario);

    let child = create_node_subname(
        &parent,
        utf8(b"node.test.iota"),
        MIN_SUBNAME_DURATION,
        true,
        true,
        scenario,
    );

    increment_clock(MIN_SUBNAME_DURATION +1, scenario);
    create_leaf_subname(
        subname_registration::nft(&child),
        utf8(b"node.node.test.iota"),
        TEST_ADDRESS,
        scenario,
    );

    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names_subnames::subnames::EInvalidExpirationDate)]
fun tries_to_create_too_short_subname() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    let parent = create_sln(utf8(b"test.iota"), scenario);

    let _child = create_node_subname(
        &parent,
        utf8(b"node.test.iota"),
        1,
        true,
        true,
        scenario,
    );

    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names_subnames::config::EInvalidParent)]
fun tries_to_created_nested_leaf_subname() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    let parent = create_sln(utf8(b"test.iota"), scenario);
    create_leaf_subname(&parent, utf8(b"node.node.test.iota"), TEST_ADDRESS, scenario);

    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names::validation::EReservedName)]
fun tries_to_create_reserved_leaf_subname() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    ts::next_tx(scenario, USER_ADDRESS);
    let mut iota_names = ts::take_shared<IotaNames>(scenario);
    let admin_cap = ts::take_from_sender<AdminCap>(scenario);
    deny_list::add_reserved_labels(&mut iota_names, &admin_cap, vector[b"reserved".to_string()]);
    ts::return_shared(iota_names);
    ts::return_to_sender(scenario, admin_cap);

    let parent = create_sln(utf8(b"test.iota"), scenario);
    create_leaf_subname(&parent, utf8(b"reserved.test.iota"), TEST_ADDRESS, scenario);

    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names::validation::EReservedName)]
fun tries_to_create_reserved_node_subname() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    ts::next_tx(scenario, USER_ADDRESS);
    let mut iota_names = ts::take_shared<IotaNames>(scenario);
    let admin_cap = ts::take_from_sender<AdminCap>(scenario);
    deny_list::add_reserved_labels(&mut iota_names, &admin_cap, vector[b"reserved".to_string()]);
    ts::return_shared(iota_names);
    ts::return_to_sender(scenario, admin_cap);

    let parent = create_sln(utf8(b"test.iota"), scenario);
    let _child = create_node_subname(
        &parent, 
        utf8(b"reserved.test.iota"), 
        1,
        true,
        true,
        scenario
    );

    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names::validation::EBlockedName)]
fun tries_to_create_blocked_leaf_subname() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    ts::next_tx(scenario, USER_ADDRESS);
    let mut iota_names = ts::take_shared<IotaNames>(scenario);
    let admin_cap = ts::take_from_sender<AdminCap>(scenario);
    deny_list::add_blocked_labels(&mut iota_names, &admin_cap, vector[b"blocked".to_string()]);
    ts::return_shared(iota_names);
    ts::return_to_sender(scenario, admin_cap);

    let parent = create_sln(utf8(b"test.iota"), scenario);
    create_leaf_subname(&parent, utf8(b"blocked.test.iota"), TEST_ADDRESS, scenario);

    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names::validation::EBlockedName)]
fun tries_to_create_blocked_node_subname() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    ts::next_tx(scenario, USER_ADDRESS);
    let mut iota_names = ts::take_shared<IotaNames>(scenario);
    let admin_cap = ts::take_from_sender<AdminCap>(scenario);
    deny_list::add_blocked_labels(&mut iota_names, &admin_cap, vector[b"blocked".to_string()]);
    ts::return_shared(iota_names);
    ts::return_to_sender(scenario, admin_cap);

    let parent = create_sln(utf8(b"test.iota"), scenario);
    let _child = create_node_subname(
        &parent, 
        utf8(b"blocked.test.iota"), 
        1,
        true,
        true,
        scenario
    );

    abort 1337
}

// == Helpers ==

public fun test_init(): Scenario {
    let mut scenario_val = ts::begin(USER_ADDRESS);
    let scenario = &mut scenario_val;
    {
        let mut iota_names = iota_names::init_for_testing(ctx(scenario));
        iota_names::authorize_for_testing<SubnamesAuth>(&mut iota_names);
        iota_names::authorize_for_testing<DenyListAuth>(&mut iota_names);
        iota_names::authorize_for_testing<ControllerAuth>(&mut iota_names);
        iota_names::share_for_testing(iota_names);
        let clock = clock::create_for_testing(ctx(scenario));
        clock::share_for_testing(clock);
    };
    {
        ts::next_tx(scenario, USER_ADDRESS);
        let admin_cap = ts::take_from_sender<AdminCap>(scenario);
        let mut iota_names = ts::take_shared<IotaNames>(scenario);
        iota_names::add_config(&admin_cap, &mut iota_names, config::default());

        registry::init_for_testing(&admin_cap, &mut iota_names, ctx(scenario));
        deny_list::setup(&mut iota_names, &admin_cap, ctx(scenario));

        ts::return_shared(iota_names);
        ts::return_to_sender(scenario, admin_cap);
    };
    scenario_val
}

/// Get the active registry of the current scenario. (mutable, so we can add extra names ourselves)
public fun registry_mut(iota_names: &mut IotaNames): &mut Registry {
    let registry_mut = iota_names::auth_registry_mut<SubnamesAuth, Registry>(
        subnames::auth_for_testing(),
        iota_names,
    );

    registry_mut
}

/// Create a regular name to help with our tests.
public fun create_sln(name: String, scenario: &mut Scenario): NameRegistration {
    ts::next_tx(scenario, USER_ADDRESS);
    let mut iota_names = ts::take_shared<IotaNames>(scenario);
    let clock = ts::take_shared<Clock>(scenario);
    let registry_mut = registry_mut(&mut iota_names);

    let parent = registry::add_record(
        registry_mut,
        name::new(name),
        1,
        &clock,
        ctx(scenario),
    );

    ts::return_shared(clock);
    ts::return_shared(iota_names);
    parent
}

/// Create a leaf subname
public fun create_leaf_subname(
    parent: &NameRegistration,
    name: String,
    target: address,
    scenario: &mut Scenario,
) {
    ts::next_tx(scenario, USER_ADDRESS);
    let mut iota_names = ts::take_shared<IotaNames>(scenario);
    let clock = ts::take_shared<Clock>(scenario);

    subnames::new_leaf(&mut iota_names, parent, &clock, name, target, ctx(scenario));

    ts::return_shared(iota_names);
    ts::return_shared(clock);
}

/// Remove a leaf subname
public fun remove_leaf_subname(
    parent: &NameRegistration,
    name: String,
    scenario: &mut Scenario,
) {
    ts::next_tx(scenario, USER_ADDRESS);
    let mut iota_names = ts::take_shared<IotaNames>(scenario);
    let clock = ts::take_shared<Clock>(scenario);

    subnames::remove_leaf(&mut iota_names, parent, &clock, name);

    ts::return_shared(iota_names);
    ts::return_shared(clock);
}

/// Create a node subname
public fun create_node_subname(
    parent: &NameRegistration,
    name: String,
    expiration: u64,
    allow_creation: bool,
    allow_extension: bool,
    scenario: &mut Scenario,
): SubnameRegistration {
    ts::next_tx(scenario, USER_ADDRESS);
    let mut iota_names = ts::take_shared<IotaNames>(scenario);
    let clock = ts::take_shared<Clock>(scenario);

    let nft = subnames::new(
        &mut iota_names,
        parent,
        &clock,
        name,
        expiration,
        allow_creation,
        allow_extension,
        ctx(scenario),
    );

    ts::return_shared(iota_names);
    ts::return_shared(clock);

    nft
}

/// Extend a node subname's expiration.
public fun extend_node_subname(
    nft: &mut SubnameRegistration,
    expiration: u64,
    scenario: &mut Scenario,
) {
    ts::next_tx(scenario, USER_ADDRESS);
    let mut iota_names = ts::take_shared<IotaNames>(scenario);
    let clock = ts::take_shared<Clock>(scenario);

    subnames::extend_expiration(&mut iota_names, nft, expiration);

    ts::return_shared(iota_names);
    ts::return_shared(clock);
}

public fun update_subname_setup(
    parent: &NameRegistration,
    subname: String,
    allow_creation: bool,
    allow_extension: bool,
    scenario: &mut Scenario,
) {
    ts::next_tx(scenario, USER_ADDRESS);
    let mut iota_names = ts::take_shared<IotaNames>(scenario);
    let clock = ts::take_shared<Clock>(scenario);

    subnames::edit_setup(
        &mut iota_names,
        parent,
        &clock,
        subname,
        allow_creation,
        allow_extension,
    );

    ts::return_shared(iota_names);
    ts::return_shared(clock);
}

public fun burn_subname(nft: SubnameRegistration, scenario: &mut Scenario) {
    ts::next_tx(scenario, USER_ADDRESS);
    let mut iota_names = ts::take_shared<IotaNames>(scenario);
    let clock = ts::take_shared<Clock>(scenario);

    subnames::burn(&mut iota_names, nft, &clock);

    ts::return_shared(iota_names);
    ts::return_shared(clock);
}

public fun increment_clock(to: u64, scenario: &mut Scenario) {
    ts::next_tx(scenario, USER_ADDRESS);
    let mut clock = ts::take_shared<Clock>(scenario);
    clock::increment_for_testing(&mut clock, to);
    ts::return_shared(clock);
}
