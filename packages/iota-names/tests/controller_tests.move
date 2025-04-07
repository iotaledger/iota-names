// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module iota_names::controller_tests;

use std::option::{extract, some, none};
use std::string::{utf8, String};
use iota::clock::{Self, Clock};
use iota::dynamic_field;
use iota::iota::IOTA;
use iota::test_scenario::{Self, Scenario, ctx};
use iota::test_utils::{assert_eq, destroy};
use iota::vec_map::VecMap;
use iota_names::constants::year_ms;
use iota_names::controller::{Self, Controller};
use iota_names::domain::{Self, Domain};
use iota_names::register::Register;
use iota_names::register_utils::register_util;
use iota_names::registry::{Self, Registry, lookup, reverse_lookup};
use iota_names::subdomain_registration;
use iota_names::iota_names::{Self, IotaNames, AdminCap};
use iota_names::iota_names_registration::{Self, IotaNamesRegistration};

use fun set_target_address_util as Scenario.set_target_address_util;
use fun set_reverse_lookup_util as Scenario.set_reverse_lookup_util;
use fun unset_reverse_lookup_util as Scenario.unset_reverse_lookup_util;
use fun set_user_data_util as Scenario.set_user_data_util;
use fun unset_user_data_util as Scenario.unset_user_data_util;
use fun lookup_util as Scenario.lookup_util;
use fun get_user_data as Scenario.get_user_data;
use fun setup as Scenario.setup;
use fun deauthorize_app_util as Scenario.deauthorize_app_util;
use fun reverse_lookup_util as Scenario.reverse_lookup_util;
use fun set_object_reverse_lookup_util as Scenario.set_object_reverse_lookup_util;
use fun unset_object_reverse_lookup_util as Scenario.unset_object_reverse_lookup_util;

const IOTA_NAMES_ADDRESS: address = @0xA001;
const FIRST_ADDRESS: address = @0xB001;
const SECOND_ADDRESS: address = @0xB002;
const DOMAIN_NAME: vector<u8> = b"abc.iota";
const AVATAR: vector<u8> = b"avatar";
const CONTENT_HASH: vector<u8> = b"content_hash";
const NANOS_PER_IOTA: u64 = 1_000_000_000;

fun test_init(): Scenario {
    let mut scenario_val = test_scenario::begin(IOTA_NAMES_ADDRESS);
    let scenario = &mut scenario_val;
    {
        let mut iota_names = iota_names::init_for_testing(scenario.ctx());
        iota_names.authorize_app_for_testing<Register>();
        iota_names.authorize_app_for_testing<Controller>();
        iota_names.share_for_testing();
        let clock = clock::create_for_testing(scenario.ctx());
        clock.share_for_testing();
    };
    {
        scenario.next_tx(IOTA_NAMES_ADDRESS);
        let admin_cap = scenario.take_from_sender<AdminCap>();
        let mut iota_names = scenario.take_shared<IotaNames>();

        registry::init_for_testing(&admin_cap, &mut iota_names, scenario.ctx());

        test_scenario::return_shared(iota_names);
        scenario.return_to_sender(admin_cap);
    };
    scenario_val
}

fun setup(scenario: &mut Scenario, sender: address, clock_tick: u64) {
    let nft = register_util<IOTA>(
        scenario,
        DOMAIN_NAME.to_string(),
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
    let nft = scenario.take_from_sender<IotaNamesRegistration>();
    let mut clock = scenario.take_shared<Clock>();

    clock.increment_for_testing(clock_tick);
    controller::set_target_address(&mut iota_names, &nft, target, &clock);

    test_scenario::return_shared(clock);
    scenario.return_to_sender(nft);
    test_scenario::return_shared(iota_names);
}

public fun set_reverse_lookup_util(scenario: &mut Scenario, sender: address, domain_name: String) {
    scenario.next_tx(sender);
    let mut iota_names = scenario.take_shared<IotaNames>();

    controller::set_reverse_lookup(&mut iota_names, domain_name, ctx(scenario));

    test_scenario::return_shared(iota_names);
}

public fun set_object_reverse_lookup_util(
    scenario: &mut Scenario,
    id: &mut UID,
    sender: address,
    domain_name: String,
) {
    scenario.next_tx(sender);
    let mut iota_names = scenario.take_shared<IotaNames>();

    controller::set_object_reverse_lookup(&mut iota_names, id, domain_name);
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
    let nft = scenario.take_from_sender<IotaNamesRegistration>();
    let mut clock = scenario.take_shared<Clock>();

    clock.increment_for_testing(clock_tick);
    controller::set_user_data(&mut iota_names, &nft, key, value, &clock);

    test_scenario::return_shared(clock);
    test_scenario::return_shared(iota_names);
    scenario.return_to_sender(nft);
}

public fun unset_user_data_util(
    scenario: &mut Scenario,
    sender: address,
    key: String,
    clock_tick: u64,
) {
    scenario.next_tx(sender);
    let mut iota_names = scenario.take_shared<IotaNames>();
    let nft = scenario.take_from_sender<IotaNamesRegistration>();
    let mut clock = scenario.take_shared<Clock>();

    clock.increment_for_testing(clock_tick);
    controller::unset_user_data(&mut iota_names, &nft, key, &clock);

    test_scenario::return_shared(clock);
    scenario.return_to_sender(nft);
    test_scenario::return_shared(iota_names);
}

fun lookup_util(
    scenario: &mut Scenario,
    domain_name: String,
    expected_target_addr: Option<address>,
) {
    scenario.next_tx(IOTA_NAMES_ADDRESS);
    let iota_names = scenario.take_shared<IotaNames>();

    let registry = iota_names.registry<Registry>();
    let record = extract(&mut lookup(registry, domain::new(domain_name)));
    assert_eq(record.target_address(), expected_target_addr);

    test_scenario::return_shared(iota_names);
}

fun get_user_data(scenario: &mut Scenario, domain_name: String): VecMap<String, String> {
    scenario.next_tx(IOTA_NAMES_ADDRESS);
    let iota_names = scenario.take_shared<IotaNames>();

    let registry = iota_names.registry<Registry>();
    let record = extract(&mut lookup(registry, domain::new(domain_name)));
    let data = *record.data();
    test_scenario::return_shared(iota_names);

    data
}

fun reverse_lookup_util(
    scenario: &mut Scenario,
    addr: address,
    expected_domain_name: Option<Domain>,
) {
    scenario.next_tx(IOTA_NAMES_ADDRESS);
    let iota_names = scenario.take_shared<IotaNames>();

    let registry = iota_names.registry<Registry>();
    let domain_name = registry.reverse_lookup(addr);
    assert_eq(domain_name, expected_domain_name);

    test_scenario::return_shared(iota_names);
}

fun deauthorize_app_util(scenario: &mut Scenario) {
    scenario.next_tx(IOTA_NAMES_ADDRESS);
    let admin_cap = scenario.take_from_sender<AdminCap>();
    let mut iota_names = scenario.take_shared<IotaNames>();

    admin_cap.deauthorize_app<Controller>(&mut iota_names);

    test_scenario::return_shared(iota_names);
    scenario.return_to_sender(admin_cap);
}

#[test]
fun test_set_target_address() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    scenario.set_target_address_util(FIRST_ADDRESS, some(SECOND_ADDRESS), 0);
    scenario.lookup_util(DOMAIN_NAME.to_string(), some(SECOND_ADDRESS));
    scenario.set_target_address_util(FIRST_ADDRESS, some(FIRST_ADDRESS), 0);
    scenario.lookup_util(DOMAIN_NAME.to_string(), some(FIRST_ADDRESS));
    scenario.set_target_address_util(FIRST_ADDRESS, none(), 0);
    scenario.lookup_util(DOMAIN_NAME.to_string(), none());

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
fun test_set_target_address_works_if_domain_is_registered_again() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);
    scenario.setup(SECOND_ADDRESS, 2 * year_ms());

    scenario.set_target_address_util(SECOND_ADDRESS, some(SECOND_ADDRESS), 0);
    scenario.lookup_util(DOMAIN_NAME.to_string(), some(SECOND_ADDRESS));

    scenario_val.end();
}

#[test, expected_failure(abort_code = ::iota_names::iota_names::EAppNotAuthorized)]
fun test_set_target_address_aborts_if_controller_is_deauthorized() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    scenario.deauthorize_app_util();
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
    scenario.set_reverse_lookup_util(SECOND_ADDRESS, DOMAIN_NAME.to_string());
    reverse_lookup_util(
        scenario,
        SECOND_ADDRESS,
        some(domain::new(DOMAIN_NAME.to_string())),
    );

    scenario.set_target_address_util(FIRST_ADDRESS, some(FIRST_ADDRESS), 0);
    scenario.reverse_lookup_util(FIRST_ADDRESS, none());
    scenario.reverse_lookup_util(SECOND_ADDRESS, none());
    scenario.set_reverse_lookup_util(FIRST_ADDRESS, DOMAIN_NAME.to_string());
    reverse_lookup_util(
        scenario,
        FIRST_ADDRESS,
        some(domain::new(DOMAIN_NAME.to_string())),
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
    scenario.set_reverse_lookup_util(SECOND_ADDRESS, DOMAIN_NAME.to_string());

    scenario_val.end();
}

#[test, expected_failure(abort_code = registry::ERecordMismatch)]
fun test_set_reverse_lookup_aborts_if_target_address_not_match() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    scenario.set_target_address_util(FIRST_ADDRESS, some(FIRST_ADDRESS), 0);
    scenario.reverse_lookup_util(SECOND_ADDRESS, none());
    scenario.set_reverse_lookup_util(SECOND_ADDRESS, DOMAIN_NAME.to_string());

    scenario_val.end();
}

#[test, expected_failure(abort_code = ::iota_names::iota_names::EAppNotAuthorized)]
fun test_set_reverse_lookup_aborts_if_controller_is_deauthorized() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    scenario.set_target_address_util(FIRST_ADDRESS, some(SECOND_ADDRESS), 0);
    scenario.deauthorize_app_util();
    scenario.set_reverse_lookup_util(SECOND_ADDRESS, DOMAIN_NAME.to_string());

    scenario_val.end();
}

#[test]
fun test_unset_reverse_lookup() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    scenario.set_target_address_util(FIRST_ADDRESS, some(SECOND_ADDRESS), 0);
    scenario.set_reverse_lookup_util(SECOND_ADDRESS, DOMAIN_NAME.to_string());
    reverse_lookup_util(
        scenario,
        SECOND_ADDRESS,
        some(domain::new(DOMAIN_NAME.to_string())),
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
    scenario.set_reverse_lookup_util(SECOND_ADDRESS, DOMAIN_NAME.to_string());
    scenario.deauthorize_app_util();
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

    let data = &scenario.get_user_data(DOMAIN_NAME.to_string());
    assert_eq(data.size(), 0);
    set_user_data_util(
        scenario,
        FIRST_ADDRESS,
        AVATAR.to_string(),
        b"value_avatar".to_string(),
        0,
    );
    let data = &scenario.get_user_data(DOMAIN_NAME.to_string());
    assert_eq(data.size(), 1);
    assert_eq(*data.get(&AVATAR.to_string()), b"value_avatar".to_string());

    set_user_data_util(
        scenario,
        FIRST_ADDRESS,
        utf8(CONTENT_HASH),
        b"value_content_hash".to_string(),
        0,
    );
    let data = &scenario.get_user_data(DOMAIN_NAME.to_string());
    assert_eq(data.size(), 2);
    assert_eq(*data.get(&AVATAR.to_string()), b"value_avatar".to_string());
    assert_eq(*data.get(&utf8(CONTENT_HASH)), b"value_content_hash".to_string());

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

#[test, expected_failure(abort_code = registry::ERecordExpired)]
fun test_set_user_data_aborts_if_nft_expired() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    set_user_data_util(
        scenario,
        FIRST_ADDRESS,
        AVATAR.to_string(),
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
        AVATAR.to_string(),
        b"value".to_string(),
        0,
    );

    scenario_val.end();
}

#[test]
fun test_set_user_data_works_if_domain_is_registered_again() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);
    scenario.setup(SECOND_ADDRESS, 2 * year_ms());

    set_user_data_util(
        scenario,
        SECOND_ADDRESS,
        AVATAR.to_string(),
        b"value".to_string(),
        0,
    );
    let data = &scenario.get_user_data(DOMAIN_NAME.to_string());
    assert_eq(data.size(), 1);
    assert_eq(*data.get(&AVATAR.to_string()), b"value".to_string());

    scenario_val.end();
}

#[test, expected_failure(abort_code = ::iota_names::iota_names::EAppNotAuthorized)]
fun test_set_user_data_aborts_if_controller_is_deauthorized() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    scenario.deauthorize_app_util();
    scenario.set_user_data_util(
        FIRST_ADDRESS,
        AVATAR.to_string(),
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
        AVATAR.to_string(),
        b"value_avatar".to_string(),
        0,
    );
    scenario.unset_user_data_util(FIRST_ADDRESS, AVATAR.to_string(), 0);
    let data = &scenario.get_user_data(DOMAIN_NAME.to_string());
    assert_eq(data.size(), 0);

    scenario.set_user_data_util(
        FIRST_ADDRESS,
        utf8(CONTENT_HASH),
        b"value_content_hash".to_string(),
        0,
    );
    scenario.set_user_data_util(
        FIRST_ADDRESS,
        AVATAR.to_string(),
        b"value_avatar".to_string(),
        0,
    );
    scenario.unset_user_data_util(FIRST_ADDRESS, utf8(CONTENT_HASH), 0);
    let data = &scenario.get_user_data(DOMAIN_NAME.to_string());
    assert_eq(data.size(), 1);
    assert_eq(*data.get(&AVATAR.to_string()), b"value_avatar".to_string());

    scenario_val.end();
}

#[test]
fun test_unset_user_data_works_if_key_not_exists() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    scenario.unset_user_data_util(FIRST_ADDRESS, AVATAR.to_string(), 0);

    scenario_val.end();
}

#[test, expected_failure(abort_code = registry::ERecordExpired)]
fun test_unset_user_data_aborts_if_nft_expired() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    scenario.unset_user_data_util(FIRST_ADDRESS, AVATAR.to_string(), 2 * year_ms());

    scenario_val.end();
}

#[test, expected_failure(abort_code = ::iota_names::iota_names::EAppNotAuthorized)]
fun test_unset_user_data_works_if_controller_is_deauthorized() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    scenario.setup(FIRST_ADDRESS, 0);

    scenario.deauthorize_app_util();
    scenario.unset_user_data_util(FIRST_ADDRESS, AVATAR.to_string(), 0);

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

    let ns_registration = iota_names_registration::new_for_testing(
        domain::new(b"test.iota".to_string()),
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

    let ns_registration = iota_names_registration::new_for_testing(
        domain::new(b"inner.test.iota".to_string()),
        1,
        &clock,
        scenario.ctx(),
    );

    let subname = subdomain_registration::new(ns_registration, &clock, scenario.ctx());

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
    scenario.set_object_reverse_lookup_util(&mut uid, FIRST_ADDRESS, DOMAIN_NAME.to_string());
    scenario.lookup_util(DOMAIN_NAME.to_string(), some(uid.to_address()));
    scenario.reverse_lookup_util(uid.to_address(), some(domain::new(DOMAIN_NAME.to_string())));

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
    scenario.set_object_reverse_lookup_util(&mut uid, FIRST_ADDRESS, DOMAIN_NAME.to_string());
    scenario.lookup_util(DOMAIN_NAME.to_string(), some(uid.to_address()));
    scenario.reverse_lookup_util(uid.to_address(), some(domain::new(DOMAIN_NAME.to_string())));


    scenario.set_target_address_util(FIRST_ADDRESS, some(FIRST_ADDRESS), 0);
    scenario.reverse_lookup_util(uid.to_address(), none());

    destroy(uid);
    scenario_val.end();
}
