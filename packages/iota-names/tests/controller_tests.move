// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module iota_names::controller_tests;

use iota::clock::{Self, Clock};
use iota::dynamic_field;
use iota::iota::IOTA;
use iota::test_scenario::{Self, Scenario, ctx};
use iota::test_utils::{assert_eq, destroy};
use iota::vec_map::VecMap;
use iota_names::core_config::CoreConfig;
use iota_names::constants::year_ms;
use iota_names::controller::{Self, ControllerAuth};
use iota_names::name::{Self, Name};
use iota_names::iota_names::{Self, IotaNames, AdminCap};
use iota_names::name_registration::{Self, NameRegistration};
use iota_names::register::RegisterAuth;
use iota_names::register_utils::register_util;
use iota_names::registry::{Self, Registry, lookup, reverse_lookup};
use iota_names::subname_registration;
use iota_names::test_init_utils;
use std::option::{extract, some, none};
use std::string::{utf8, String};

use fun set_target_address_util as Scenario.set_target_address_util;
use fun set_reverse_lookup_util as Scenario.set_reverse_lookup_util;
use fun unset_reverse_lookup_util as Scenario.unset_reverse_lookup_util;
use fun set_user_data_util as Scenario.set_user_data_util;
use fun unset_user_data_util as Scenario.unset_user_data_util;
use fun lookup_util as Scenario.lookup_util;
use fun get_user_data as Scenario.get_user_data;
use fun setup as Scenario.setup;
use fun deauthorize_util as Scenario.deauthorize_util;
use fun reverse_lookup_util as Scenario.reverse_lookup_util;
use fun set_object_reverse_lookup_util as Scenario.set_object_reverse_lookup_util;
use fun unset_object_reverse_lookup_util as Scenario.unset_object_reverse_lookup_util;

const IOTA_NAMES_ADDRESS: address = @0xA001;
const FIRST_ADDRESS: address = @0xB001;
const SECOND_ADDRESS: address = @0xB002;
const NAME: vector<u8> = b"abc.iota";
const DATA_KEY_AVATAR: vector<u8> = b"avatar";
const DATA_KEY_IPFS: vector<u8> = b"ipfs";
const NANOS_PER_IOTA: u64 = 1_000_000_000;

fun test_init(): Scenario {
    let mut scenario_val = test_scenario::begin(IOTA_NAMES_ADDRESS);
    let scenario = &mut scenario_val;
    {
        let mut iota_names = iota_names::init_for_testing(scenario.ctx());
        iota_names.authorize_for_testing<RegisterAuth>();
        iota_names.authorize_for_testing<ControllerAuth>();
        iota_names.share_for_testing();
        let clock = clock::create_for_testing(scenario.ctx());
        clock.share_for_testing();
    };
    {
        scenario.next_tx(IOTA_NAMES_ADDRESS);
        let admin_cap = scenario.take_from_sender<AdminCap>();
        let mut iota_names = scenario.take_shared<IotaNames>();

        test_init_utils::setup_for_testing(&mut iota_names, &admin_cap, scenario.ctx());

        test_scenario::return_shared(iota_names);
        scenario.return_to_sender(admin_cap);
    };
    scenario_val
}

fun setup(scenario: &mut Scenario, sender: address, clock_tick: u64) {
    let nft = register_util<IOTA>(
        scenario,
        NAME.to_string(),
        1,
        1200 * NANOS_PER_IOTA,
        clock_tick,
    );
    transfer::public_transfer(nft, sender);
}

public fun set_target_address_util(
    scenario: &mut Scenario,
    sender: address,
    target: Option<address>,
    clock_tick: u64,
) {
    scenario.next_tx(sender);
    let mut iota_names = scenario.take_shared<IotaNames>();
    let nft = scenario.take_from_sender<NameRegistration>();
    let mut clock = scenario.take_shared<Clock>();

    clock.increment_for_testing(clock_tick);
    controller::set_target_address(&mut iota_names, &nft, target, &clock);

    test_scenario::return_shared(clock);
    scenario.return_to_sender(nft);
    test_scenario::return_shared(iota_names);
}

public fun set_reverse_lookup_util(scenario: &mut Scenario, sender: address, name: String,) {
    scenario.next_tx(sender);
    let mut iota_names = scenario.take_shared<IotaNames>();

    controller::set_reverse_lookup(&mut iota_names, name, ctx(scenario));

    test_scenario::return_shared(iota_names);
}

public fun set_object_reverse_lookup_util(
    scenario: &mut Scenario,
    id: &mut UID,
    sender: address,
    name: String,
) {
    scenario.next_tx(sender);
    let mut iota_names = scenario.take_shared<IotaNames>();

    controller::set_object_reverse_lookup(&mut iota_names, id, name);
    test_scenario::return_shared(iota_names);
}

public fun unset_object_reverse_lookup_util(
    scenario: &mut Scenario,
    id: &mut UID,
    sender: address,
) {
    scenario.next_tx(sender);
    let mut iota_names = scenario.take_shared<IotaNames>();

    controller::unset_object_reverse_lookup(&mut iota_names, id);
    test_scenario::return_shared(iota_names);
}

public fun unset_reverse_lookup_util(scenario: &mut Scenario, sender: address) {
    scenario.next_tx(sender);
    let mut iota_names = scenario.take_shared<IotaNames>();

    controller::unset_reverse_lookup(&mut iota_names, ctx(scenario));

    test_scenario::return_shared(iota_names);
}

public fun set_user_data_util(
    scenario: &mut Scenario,
    sender: address,
    key: String,
    value: String,
    clock_tick: u64,
) {
    scenario.next_tx(sender);
    let mut iota_names = scenario.take_shared<IotaNames>();
    let nft = scenario.take_from_sender<NameRegistration>();
    let mut clock = scenario.take_shared<Clock>();

    clock.increment_for_testing(clock_tick);
    controller::set_user_data(&mut iota_names, &nft, key, value, &clock);

    test_scenario::return_shared(clock);
    test_scenario::return_shared(iota_names);
    scenario.return_to_sender(nft);
}

public fun add_user_data_key_util(
    scenario: &mut Scenario,
    key: String,
    clock_tick: u64,
) {
    scenario.next_tx(IOTA_NAMES_ADDRESS);
    let admin_cap = scenario.take_from_sender<AdminCap>();
    let mut iota_names = scenario.take_shared<IotaNames>();
    let mut clock = scenario.take_shared<Clock>();

    clock.increment_for_testing(clock_tick);
    let config = iota_names::get_config_mut<CoreConfig>(&admin_cap, &mut iota_names);
    config.add_user_data_key(key);

    test_scenario::return_shared(clock);
    test_scenario::return_shared(iota_names);
    scenario.return_to_sender(admin_cap);
}

public fun unset_user_data_util(
    scenario: &mut Scenario,
    sender: address,
    key: String,
    clock_tick: u64,
) {
    scenario.next_tx(sender);
    let mut iota_names = scenario.take_shared<IotaNames>();
    let nft = scenario.take_from_sender<NameRegistration>();
    let mut clock = scenario.take_shared<Clock>();

    clock.increment_for_testing(clock_tick);
    controller::unset_user_data(&mut iota_names, &nft, key, &clock);

    test_scenario::return_shared(clock);
    scenario.return_to_sender(nft);
    test_scenario::return_shared(iota_names);
}

fun lookup_util(
    scenario: &mut Scenario,
    name: String,
    expected_target_addr: Option<address>,
) {
    scenario.next_tx(IOTA_NAMES_ADDRESS);
    let iota_names = scenario.take_shared<IotaNames>();

    let registry = iota_names.registry<Registry>();
    let record = extract(&mut lookup(registry, name::new(name)));
    assert_eq(record.target_address(), expected_target_addr);

    test_scenario::return_shared(iota_names);
}

fun get_user_data(scenario: &mut Scenario, name: String,): VecMap<String, String> {
    scenario.next_tx(IOTA_NAMES_ADDRESS);
    let iota_names = scenario.take_shared<IotaNames>();

    let registry = iota_names.registry<Registry>();
    let record = extract(&mut lookup(registry, name::new(name)));
    let data = *record.data();
    test_scenario::return_shared(iota_names);

    data
}

fun reverse_lookup_util(
    scenario: &mut Scenario,
    addr: address,
    expected_name: Option<Name>,
) {
    scenario.next_tx(IOTA_NAMES_ADDRESS);
    let iota_names = scenario.take_shared<IotaNames>();

    let registry = iota_names.registry<Registry>();
    let name = registry.reverse_lookup(addr);
    assert_eq(name, expected_name);

    test_scenario::return_shared(iota_names);
}

fun deauthorize_util(scenario: &mut Scenario) {
    scenario.next_tx(IOTA_NAMES_ADDRESS);
    let admin_cap = scenario.take_from_sender<AdminCap>();
    let mut iota_names = scenario.take_shared<IotaNames>();

    admin_cap.deauthorize<ControllerAuth>(&mut iota_names);

    test_scenario::return_shared(iota_names);
    scenario.return_to_sender(admin_cap);
}

#[test]
fun test_set_target_address() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    scenario.set_target_address_util(FIRST_ADDRESS, some(SECOND_ADDRESS), 0);
    scenario.lookup_util(NAME.to_string(), some(SECOND_ADDRESS));
    scenario.set_target_address_util(FIRST_ADDRESS, some(FIRST_ADDRESS), 0);
    scenario.lookup_util(NAME.to_string(), some(FIRST_ADDRESS));
    scenario.set_target_address_util(FIRST_ADDRESS, none(), 0);
    scenario.lookup_util(NAME.to_string(), none());

    scenario_val.end();
}

#[test, expected_failure(abort_code = registry::ERecordExpired)]
fun test_set_target_address_aborts_if_nft_expired() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    scenario.set_target_address_util(
        FIRST_ADDRESS,
        some(SECOND_ADDRESS),
        2 * year_ms(),
    );

    scenario_val.end();
}

#[test, expected_failure(abort_code = registry::EIdMismatch)]
fun test_set_target_address_aborts_if_nft_expired_2() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);
    scenario.setup(SECOND_ADDRESS, 2 * year_ms());

    scenario.set_target_address_util(FIRST_ADDRESS, some(SECOND_ADDRESS), 0);

    scenario_val.end();
}

#[test]
fun test_set_target_address_works_if_name_is_registered_again() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);
    scenario.setup(SECOND_ADDRESS, 2 * year_ms());

    scenario.set_target_address_util(SECOND_ADDRESS, some(SECOND_ADDRESS), 0);
    scenario.lookup_util(NAME.to_string(), some(SECOND_ADDRESS));

    scenario_val.end();
}

#[test, expected_failure(abort_code = ::iota_names::iota_names::EAppNotAuthorized)]
fun test_set_target_address_aborts_if_controller_is_deauthorized() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    scenario.deauthorize_util();
    scenario.set_target_address_util(FIRST_ADDRESS, some(SECOND_ADDRESS), 0);

    scenario_val.end();
}

#[test]
fun test_set_reverse_lookup() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    scenario.set_target_address_util(FIRST_ADDRESS, some(SECOND_ADDRESS), 0);
    scenario.reverse_lookup_util(SECOND_ADDRESS, none());
    scenario.set_reverse_lookup_util(SECOND_ADDRESS, NAME.to_string());
    reverse_lookup_util(
        scenario,
        SECOND_ADDRESS,
        some(name::new(NAME.to_string())),
    );

    scenario.set_target_address_util(FIRST_ADDRESS, some(FIRST_ADDRESS), 0);
    scenario.reverse_lookup_util(FIRST_ADDRESS, none());
    scenario.reverse_lookup_util(SECOND_ADDRESS, none());
    scenario.set_reverse_lookup_util(FIRST_ADDRESS, NAME.to_string());
    reverse_lookup_util(
        scenario,
        FIRST_ADDRESS,
        some(name::new(NAME.to_string())),
    );
    scenario.reverse_lookup_util(SECOND_ADDRESS, none());

    scenario_val.end();
}

#[test, expected_failure(abort_code = registry::ETargetNotSet)]
fun test_set_reverse_lookup_aborts_if_target_address_not_set() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    scenario.reverse_lookup_util(SECOND_ADDRESS, none());
    scenario.set_reverse_lookup_util(SECOND_ADDRESS, NAME.to_string());

    scenario_val.end();
}

#[test, expected_failure(abort_code = registry::ERecordMismatch)]
fun test_set_reverse_lookup_aborts_if_target_address_not_match() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    scenario.set_target_address_util(FIRST_ADDRESS, some(FIRST_ADDRESS), 0);
    scenario.reverse_lookup_util(SECOND_ADDRESS, none());
    scenario.set_reverse_lookup_util(SECOND_ADDRESS, NAME.to_string());

    scenario_val.end();
}

#[test, expected_failure(abort_code = ::iota_names::iota_names::EAppNotAuthorized)]
fun test_set_reverse_lookup_aborts_if_controller_is_deauthorized() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    scenario.set_target_address_util(FIRST_ADDRESS, some(SECOND_ADDRESS), 0);
    scenario.deauthorize_util();
    scenario.set_reverse_lookup_util(SECOND_ADDRESS, NAME.to_string());

    scenario_val.end();
}

#[test]
fun test_unset_reverse_lookup() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    scenario.set_target_address_util(FIRST_ADDRESS, some(SECOND_ADDRESS), 0);
    scenario.set_reverse_lookup_util(SECOND_ADDRESS, NAME.to_string());
    reverse_lookup_util(
        scenario,
        SECOND_ADDRESS,
        some(name::new(NAME.to_string())),
    );
    scenario.unset_reverse_lookup_util(SECOND_ADDRESS);
    scenario.reverse_lookup_util(SECOND_ADDRESS, none());

    scenario_val.end();
}

#[test, expected_failure(abort_code = ::iota_names::iota_names::EAppNotAuthorized)]
fun test_unset_reverse_lookup_if_controller_is_deauthorized() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    scenario.set_target_address_util(FIRST_ADDRESS, some(SECOND_ADDRESS), 0);
    scenario.set_reverse_lookup_util(SECOND_ADDRESS, NAME.to_string());
    scenario.deauthorize_util();
    scenario.unset_reverse_lookup_util(SECOND_ADDRESS);

    scenario_val.end();
}

#[test, expected_failure(abort_code = dynamic_field::EFieldDoesNotExist)]
fun test_unset_reverse_lookup_aborts_if_not_set() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    scenario.unset_reverse_lookup_util(SECOND_ADDRESS);

    scenario_val.end();
}

#[test]
fun test_set_user_data() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    let data = &scenario.get_user_data(NAME.to_string());
    assert_eq(data.size(), 0);
    set_user_data_util(
        scenario,
        FIRST_ADDRESS,
        DATA_KEY_AVATAR.to_string(),
        b"value_avatar".to_string(),
        0,
    );
    let data = &scenario.get_user_data(NAME.to_string());
    assert_eq(data.size(), 1);
    assert_eq(*data.get(&DATA_KEY_AVATAR.to_string()), b"value_avatar".to_string());

    set_user_data_util(
        scenario,
        FIRST_ADDRESS,
        utf8(DATA_KEY_IPFS),
        b"value_ipfs".to_string(),
        0,
    );
    let data = &scenario.get_user_data(NAME.to_string());
    assert_eq(data.size(), 2);
    assert_eq(*data.get(&DATA_KEY_AVATAR.to_string()), b"value_avatar".to_string());
    assert_eq(*data.get(&utf8(DATA_KEY_IPFS)), b"value_ipfs".to_string());

    scenario_val.end();
}

#[test, expected_failure(abort_code = controller::EUnsupportedKey)]
fun test_set_user_data_aborts_if_key_is_unsupported() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    set_user_data_util(
        scenario,
        FIRST_ADDRESS,
        b"key".to_string(),
        b"value".to_string(),
        0,
    );

    scenario_val.end();
}

#[test]
fun test_set_user_data_admin_add_key() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    scenario.setup(FIRST_ADDRESS, 0);

    add_user_data_key_util(scenario, b"key".to_string(), 0);

    let data = &scenario.get_user_data(NAME.to_string());
    assert_eq(data.size(), 0);
    set_user_data_util(
        scenario,
        FIRST_ADDRESS,
        b"key".to_string(),
        b"value".to_string(),
        0,
    );

    let data = &scenario.get_user_data(NAME.to_string());
    assert_eq(data.size(), 1);
    assert_eq(*data.get(&b"key".to_string()), b"value".to_string());

    scenario_val.end();
}

#[test, expected_failure(abort_code = registry::ERecordExpired)]
fun test_set_user_data_aborts_if_nft_expired() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    set_user_data_util(
        scenario,
        FIRST_ADDRESS,
        DATA_KEY_AVATAR.to_string(),
        b"value".to_string(),
        2 * year_ms(),
    );

    scenario_val.end();
}

#[test, expected_failure(abort_code = registry::EIdMismatch)]
fun test_set_user_data_aborts_if_nft_expired_2() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);
    scenario.setup(SECOND_ADDRESS, 2 * year_ms());

    set_user_data_util(
        scenario,
        FIRST_ADDRESS,
        DATA_KEY_AVATAR.to_string(),
        b"value".to_string(),
        0,
    );

    scenario_val.end();
}

#[test]
fun test_set_user_data_works_if_name_is_registered_again() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);
    scenario.setup(SECOND_ADDRESS, 2 * year_ms());

    set_user_data_util(
        scenario,
        SECOND_ADDRESS,
        DATA_KEY_AVATAR.to_string(),
        b"value".to_string(),
        0,
    );
    let data = &scenario.get_user_data(NAME.to_string());
    assert_eq(data.size(), 1);
    assert_eq(*data.get(&DATA_KEY_AVATAR.to_string()), b"value".to_string());

    scenario_val.end();
}

#[test, expected_failure(abort_code = ::iota_names::iota_names::EAppNotAuthorized)]
fun test_set_user_data_aborts_if_controller_is_deauthorized() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    scenario.deauthorize_util();
    scenario.set_user_data_util(
        FIRST_ADDRESS,
        DATA_KEY_AVATAR.to_string(),
        b"value_avatar".to_string(),
        0,
    );

    scenario_val.end();
}

#[test]
fun test_unset_user_data() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    scenario.set_user_data_util(
        FIRST_ADDRESS,
        DATA_KEY_AVATAR.to_string(),
        b"value_avatar".to_string(),
        0,
    );
    scenario.unset_user_data_util(FIRST_ADDRESS, DATA_KEY_AVATAR.to_string(), 0);
    let data = &scenario.get_user_data(NAME.to_string());
    assert_eq(data.size(), 0);

    scenario.set_user_data_util(
        FIRST_ADDRESS,
        utf8(DATA_KEY_IPFS),
        b"value_ipfs".to_string(),
        0,
    );
    scenario.set_user_data_util(
        FIRST_ADDRESS,
        DATA_KEY_AVATAR.to_string(),
        b"value_avatar".to_string(),
        0,
    );
    scenario.unset_user_data_util(FIRST_ADDRESS, utf8(DATA_KEY_IPFS), 0);
    let data = &scenario.get_user_data(NAME.to_string());
    assert_eq(data.size(), 1);
    assert_eq(*data.get(&DATA_KEY_AVATAR.to_string()), b"value_avatar".to_string());

    scenario_val.end();
}

#[test]
fun test_unset_user_data_works_if_key_not_exists() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    scenario.unset_user_data_util(FIRST_ADDRESS, DATA_KEY_AVATAR.to_string(), 0);

    scenario_val.end();
}

#[test, expected_failure(abort_code = registry::ERecordExpired)]
fun test_unset_user_data_aborts_if_nft_expired() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    scenario.unset_user_data_util(FIRST_ADDRESS, DATA_KEY_AVATAR.to_string(), 2 * year_ms());

    scenario_val.end();
}

#[test, expected_failure(abort_code = ::iota_names::iota_names::EAppNotAuthorized)]
fun test_unset_user_data_works_if_controller_is_deauthorized() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    scenario.deauthorize_util();
    scenario.unset_user_data_util(FIRST_ADDRESS, DATA_KEY_AVATAR.to_string(), 0);

    scenario_val.end();
}

#[test]
fun test_burn_expired() {
    // Only testing the surface with burning, as most logic is enforced/tested on the registry level.
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.next_tx(IOTA_NAMES_ADDRESS);

    let mut clock = scenario.take_shared<Clock>();
    let mut iota_names = scenario.take_shared<IotaNames>();

    let ns_registration = name_registration::new_for_testing(
        name::new(b"test.iota".to_string()),
        1,
        &clock,
        scenario.ctx(),
    );

    clock.increment_for_testing(year_ms() * 2);
    controller::burn_expired(&mut iota_names, ns_registration, &clock);

    test_scenario::return_shared(clock);
    test_scenario::return_shared(iota_names);

    scenario_val.end();
}

#[test]
fun test_burn_subname_expired() {
    // Only testing the surface with burning, as most logic is enforced/tested on the registry level.
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.next_tx(IOTA_NAMES_ADDRESS);

    let mut clock = scenario.take_shared<Clock>();
    let mut iota_names = scenario.take_shared<IotaNames>();

    let ns_registration = name_registration::new_for_testing(
        name::new(b"inner.test.iota".to_string()),
        1,
        &clock,
        scenario.ctx(),
    );

    let subname = subname_registration::new(ns_registration, &clock, scenario.ctx());

    clock.increment_for_testing(year_ms() * 2);
    controller::burn_expired_subname(&mut iota_names, subname, &clock);

    test_scenario::return_shared(clock);
    test_scenario::return_shared(iota_names);

    scenario_val.end();
}

#[test]
fun test_object_reverse_lookup() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let mut uid = object::new(scenario.ctx());

    scenario.setup(FIRST_ADDRESS, 0);

    scenario.set_target_address_util(FIRST_ADDRESS, some(uid.to_address()), 0);
    scenario.set_object_reverse_lookup_util(&mut uid, FIRST_ADDRESS, NAME.to_string());
    scenario.lookup_util(NAME.to_string(), some(uid.to_address()));
    scenario.reverse_lookup_util(uid.to_address(), some(name::new(NAME.to_string())));

    // now let's remove this reverse lookup
    scenario.unset_object_reverse_lookup_util(&mut uid, FIRST_ADDRESS);
    scenario.reverse_lookup_util(uid.to_address(), none());

    destroy(uid);
    scenario_val.end();
}

#[test]
fun test_reverse_reset_when_target_address_changes() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;

    let mut uid = object::new(scenario.ctx());

    scenario.setup(FIRST_ADDRESS, 0);

    scenario.set_target_address_util(FIRST_ADDRESS, some(uid.to_address()), 0);
    scenario.set_object_reverse_lookup_util(&mut uid, FIRST_ADDRESS, NAME.to_string());
    scenario.lookup_util(NAME.to_string(), some(uid.to_address()));
    scenario.reverse_lookup_util(uid.to_address(), some(name::new(NAME.to_string())));

    scenario.set_target_address_util(FIRST_ADDRESS, some(FIRST_ADDRESS), 0);
    scenario.reverse_lookup_util(uid.to_address(), none());

    destroy(uid);
    scenario_val.end();
}