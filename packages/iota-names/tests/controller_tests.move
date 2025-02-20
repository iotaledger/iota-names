// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module iota_names::controller_tests;

use std::option::{extract, some, none};
use std::string::{utf8, String};
use iota::clock::{Self, Clock};
use iota::dynamic_field;
use iota::test_scenario::{Self, Scenario, ctx};
use iota::test_utils::assert_eq;
use iota::vec_map::VecMap;
use iota_names::constants::{nanos_per_iota, year_ms};
use iota_names::controller::{
    Self,
    Controller,
    set_target_address_for_testing,
    set_reverse_lookup_for_testing,
    unset_reverse_lookup_for_testing,
    set_user_data_for_testing,
    unset_user_data_for_testing
};
use iota_names::domain::{Self, Domain};
use iota_names::register_sample::Register;
use iota_names::register_sample_tests::register_util;
use iota_names::registry::{Self, Registry, lookup, reverse_lookup};
use iota_names::iota_names::{Self, IotaNames, AdminCap};
use iota_names::iota_names_nft::IotaNamesNft;

const IOTA_NAMES_ADDRESS: address = @0xA001;
const FIRST_ADDRESS: address = @0xB001;
const SECOND_ADDRESS: address = @0xB002;
const DOMAIN_NAME: vector<u8> = b"abc.iota";
const AVATAR: vector<u8> = b"avatar";
const CONTENT_HASH: vector<u8> = b"content_hash";

fun test_init(): Scenario {
    let mut scenario_val = test_scenario::begin(IOTA_NAMES_ADDRESS);
    let scenario = &mut scenario_val;
    {
        let mut iota_names = iota_names::init_for_testing(ctx(scenario));
        iota_names.authorize_app_for_testing<Register>();
        iota_names::authorize_app_for_testing<Controller>(&mut iota_names);
        iota_names::share_for_testing(iota_names);
        let clock = clock::create_for_testing(ctx(scenario));
        clock.share_for_testing();
    };
    {
        scenario.next_tx(IOTA_NAMES_ADDRESS);
        let admin_cap = scenario.take_from_sender<AdminCap>();
        let mut iota_names = scenario.take_shared<IotaNames>();

        registry::init_for_testing(&admin_cap, &mut iota_names, ctx(scenario));

        test_scenario::return_shared(iota_names);
        test_scenario::return_to_sender(scenario, admin_cap);
    };
    scenario_val
}

fun setup(scenario: &mut Scenario, sender: address, clock_tick: u64) {
    let nft = register_util(
        scenario,
        utf8(DOMAIN_NAME),
        1,
        1200 * nanos_per_iota(),
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
    let nft = scenario.take_from_sender<IotaNamesNft>();
    let mut clock = scenario.take_shared<Clock>();

    clock.increment_for_testing(clock_tick);
    set_target_address_for_testing(&mut iota_names, &nft, target, &clock);

    test_scenario::return_shared(clock);
    test_scenario::return_to_sender(scenario, nft);
    test_scenario::return_shared(iota_names);
}

public fun set_reverse_lookup_util(
    scenario: &mut Scenario,
    sender: address,
    domain_name: String,
) {
    scenario.next_tx(sender);
    let mut iota_names = scenario.take_shared<IotaNames>();

    set_reverse_lookup_for_testing(&mut iota_names, domain_name, ctx(scenario));

    test_scenario::return_shared(iota_names);
}

public fun unset_reverse_lookup_util(scenario: &mut Scenario, sender: address) {
    scenario.next_tx(sender);
    let mut iota_names = scenario.take_shared<IotaNames>();

    unset_reverse_lookup_for_testing(&mut iota_names, ctx(scenario));

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
    let nft = scenario.take_from_sender<IotaNamesNft>();
    let mut clock = scenario.take_shared<Clock>();

    clock.increment_for_testing(clock_tick);
    set_user_data_for_testing(&mut iota_names, &nft, key, value, &clock);

    test_scenario::return_shared(clock);
    test_scenario::return_to_sender(scenario, nft);
    test_scenario::return_shared(iota_names);
}

public fun unset_user_data_util(
    scenario: &mut Scenario,
    sender: address,
    key: String,
    clock_tick: u64,
) {
    scenario.next_tx(sender);
    let mut iota_names = scenario.take_shared<IotaNames>();
    let nft = scenario.take_from_sender<IotaNamesNft>();
    let mut clock = scenario.take_shared<Clock>();

    clock.increment_for_testing(clock_tick);
    unset_user_data_for_testing(&mut iota_names, &nft, key, &clock);

    test_scenario::return_shared(clock);
    test_scenario::return_to_sender(scenario, nft);
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

fun get_user_data(
    scenario: &mut Scenario,
    domain_name: String,
): VecMap<String, String> {
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
    let domain_name = reverse_lookup(registry, addr);
    assert_eq(domain_name, expected_domain_name);

    test_scenario::return_shared(iota_names);
}

fun deauthorize_app_util(scenario: &mut Scenario) {
    scenario.next_tx(IOTA_NAMES_ADDRESS);
    let admin_cap = scenario.take_from_sender<AdminCap>();
    let mut iota_names = scenario.take_shared<IotaNames>();

    iota_names::deauthorize_app<Controller>(&admin_cap, &mut iota_names);

    test_scenario::return_shared(iota_names);
    test_scenario::return_to_sender(scenario, admin_cap);
}

#[test]
fun test_set_target_address() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    setup(scenario, FIRST_ADDRESS, 0);

    set_target_address_util(scenario, FIRST_ADDRESS, some(SECOND_ADDRESS), 0);
    lookup_util(scenario, utf8(DOMAIN_NAME), some(SECOND_ADDRESS));
    set_target_address_util(scenario, FIRST_ADDRESS, some(FIRST_ADDRESS), 0);
    lookup_util(scenario, utf8(DOMAIN_NAME), some(FIRST_ADDRESS));
    set_target_address_util(scenario, FIRST_ADDRESS, none(), 0);
    lookup_util(scenario, utf8(DOMAIN_NAME), none());

    scenario_val.end();
}

#[test, expected_failure(abort_code = registry::ERecordExpired)]
fun test_set_target_address_aborts_if_nft_expired() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    setup(scenario, FIRST_ADDRESS, 0);

    set_target_address_util(
        scenario,
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
    setup(scenario, FIRST_ADDRESS, 0);
    setup(scenario, SECOND_ADDRESS, 2 * year_ms());

    set_target_address_util(scenario, FIRST_ADDRESS, some(SECOND_ADDRESS), 0);

    scenario_val.end();
}

#[test]
fun test_set_target_address_works_if_domain_is_registered_again() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    setup(scenario, FIRST_ADDRESS, 0);
    setup(scenario, SECOND_ADDRESS, 2 * year_ms());

    set_target_address_util(scenario, SECOND_ADDRESS, some(SECOND_ADDRESS), 0);
    lookup_util(scenario, utf8(DOMAIN_NAME), some(SECOND_ADDRESS));

    scenario_val.end();
}

#[test, expected_failure(abort_code = ::iota_names::iota_names::EAppNotAuthorized)]
fun test_set_target_address_aborts_if_controller_is_deauthorized() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    setup(scenario, FIRST_ADDRESS, 0);

    deauthorize_app_util(scenario);
    set_target_address_util(scenario, FIRST_ADDRESS, some(SECOND_ADDRESS), 0);

    scenario_val.end();
}

#[test]
fun test_set_reverse_lookup() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    setup(scenario, FIRST_ADDRESS, 0);

    set_target_address_util(scenario, FIRST_ADDRESS, some(SECOND_ADDRESS), 0);
    reverse_lookup_util(scenario, SECOND_ADDRESS, none());
    set_reverse_lookup_util(scenario, SECOND_ADDRESS, utf8(DOMAIN_NAME));
    reverse_lookup_util(
        scenario,
        SECOND_ADDRESS,
        some(domain::new(utf8(DOMAIN_NAME))),
    );

    set_target_address_util(scenario, FIRST_ADDRESS, some(FIRST_ADDRESS), 0);
    reverse_lookup_util(scenario, FIRST_ADDRESS, none());
    reverse_lookup_util(scenario, SECOND_ADDRESS, none());
    set_reverse_lookup_util(scenario, FIRST_ADDRESS, utf8(DOMAIN_NAME));
    reverse_lookup_util(
        scenario,
        FIRST_ADDRESS,
        some(domain::new(utf8(DOMAIN_NAME))),
    );
    reverse_lookup_util(scenario, SECOND_ADDRESS, none());

    scenario_val.end();
}

#[test, expected_failure(abort_code = registry::ETargetNotSet)]
fun test_set_reverse_lookup_aborts_if_target_address_not_set() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    setup(scenario, FIRST_ADDRESS, 0);

    reverse_lookup_util(scenario, SECOND_ADDRESS, none());
    set_reverse_lookup_util(scenario, SECOND_ADDRESS, utf8(DOMAIN_NAME));

    scenario_val.end();
}

#[test, expected_failure(abort_code = registry::ERecordMismatch)]
fun test_set_reverse_lookup_aborts_if_target_address_not_match() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    setup(scenario, FIRST_ADDRESS, 0);

    set_target_address_util(scenario, FIRST_ADDRESS, some(FIRST_ADDRESS), 0);
    reverse_lookup_util(scenario, SECOND_ADDRESS, none());
    set_reverse_lookup_util(scenario, SECOND_ADDRESS, utf8(DOMAIN_NAME));

    scenario_val.end();
}

#[test, expected_failure(abort_code = ::iota_names::iota_names::EAppNotAuthorized)]
fun test_set_reverse_lookup_aborts_if_controller_is_deauthorized() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    setup(scenario, FIRST_ADDRESS, 0);

    set_target_address_util(scenario, FIRST_ADDRESS, some(SECOND_ADDRESS), 0);
    deauthorize_app_util(scenario);
    set_reverse_lookup_util(scenario, SECOND_ADDRESS, utf8(DOMAIN_NAME));

    scenario_val.end();
}

#[test]
fun test_unset_reverse_lookup() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    setup(scenario, FIRST_ADDRESS, 0);

    set_target_address_util(scenario, FIRST_ADDRESS, some(SECOND_ADDRESS), 0);
    set_reverse_lookup_util(scenario, SECOND_ADDRESS, utf8(DOMAIN_NAME));
    reverse_lookup_util(
        scenario,
        SECOND_ADDRESS,
        some(domain::new(utf8(DOMAIN_NAME))),
    );
    unset_reverse_lookup_util(scenario, SECOND_ADDRESS);
    reverse_lookup_util(scenario, SECOND_ADDRESS, none());

    scenario_val.end();
}

#[test, expected_failure(abort_code = ::iota_names::iota_names::EAppNotAuthorized)]
fun test_unset_reverse_lookup_if_controller_is_deauthorized() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    setup(scenario, FIRST_ADDRESS, 0);

    set_target_address_util(scenario, FIRST_ADDRESS, some(SECOND_ADDRESS), 0);
    set_reverse_lookup_util(scenario, SECOND_ADDRESS, utf8(DOMAIN_NAME));
    deauthorize_app_util(scenario);
    unset_reverse_lookup_util(scenario, SECOND_ADDRESS);

    scenario_val.end();
}

#[test, expected_failure(abort_code = dynamic_field::EFieldDoesNotExist)]
fun test_unset_reverse_lookup_aborts_if_not_set() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    setup(scenario, FIRST_ADDRESS, 0);

    unset_reverse_lookup_util(scenario, SECOND_ADDRESS);

    scenario_val.end();
}

#[test]
fun test_set_user_data() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    setup(scenario, FIRST_ADDRESS, 0);

    let data = &get_user_data(scenario, utf8(DOMAIN_NAME));
    assert_eq(data.size(), 0);
    set_user_data_util(
        scenario,
        FIRST_ADDRESS,
        utf8(AVATAR),
        utf8(b"value_avatar"),
        0,
    );
    let data = &get_user_data(scenario, utf8(DOMAIN_NAME));
    assert_eq(data.size(), 1);
    assert_eq(*data.get(&utf8(AVATAR)), utf8(b"value_avatar"));

    set_user_data_util(
        scenario,
        FIRST_ADDRESS,
        utf8(CONTENT_HASH),
        utf8(b"value_content_hash"),
        0,
    );
    let data = &get_user_data(scenario, utf8(DOMAIN_NAME));
    assert_eq(data.size(), 2);
    assert_eq(*data.get(&utf8(AVATAR)), utf8(b"value_avatar"));
    assert_eq(*data.get(&utf8(CONTENT_HASH)), utf8(b"value_content_hash"));

    scenario_val.end();
}

#[test, expected_failure(abort_code = controller::EUnsupportedKey)]
fun test_set_user_data_aborts_if_key_is_unsupported() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    setup(scenario, FIRST_ADDRESS, 0);

    set_user_data_util(
        scenario,
        FIRST_ADDRESS,
        utf8(b"key"),
        utf8(b"value"),
        0,
    );

    scenario_val.end();
}

#[test, expected_failure(abort_code = registry::ERecordExpired)]
fun test_set_user_data_aborts_if_nft_expired() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    setup(scenario, FIRST_ADDRESS, 0);

    set_user_data_util(
        scenario,
        FIRST_ADDRESS,
        utf8(AVATAR),
        utf8(b"value"),
        2 * year_ms(),
    );

    scenario_val.end();
}

#[test, expected_failure(abort_code = registry::EIdMismatch)]
fun test_set_user_data_aborts_if_nft_expired_2() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    setup(scenario, FIRST_ADDRESS, 0);
    setup(scenario, SECOND_ADDRESS, 2 * year_ms());

    set_user_data_util(
        scenario,
        FIRST_ADDRESS,
        utf8(AVATAR),
        utf8(b"value"),
        0,
    );

    scenario_val.end();
}

#[test]
fun test_set_user_data_works_if_domain_is_registered_again() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    setup(scenario, FIRST_ADDRESS, 0);
    setup(scenario, SECOND_ADDRESS, 2 * year_ms());

    set_user_data_util(
        scenario,
        SECOND_ADDRESS,
        utf8(AVATAR),
        utf8(b"value"),
        0,
    );
    let data = &get_user_data(scenario, utf8(DOMAIN_NAME));
    assert_eq(data.size(), 1);
    assert_eq(*data.get(&utf8(AVATAR)), utf8(b"value"));

    scenario_val.end();
}

#[test, expected_failure(abort_code = ::iota_names::iota_names::EAppNotAuthorized)]
fun test_set_user_data_aborts_if_controller_is_deauthorized() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    setup(scenario, FIRST_ADDRESS, 0);

    deauthorize_app_util(scenario);
    set_user_data_util(
        scenario,
        FIRST_ADDRESS,
        utf8(AVATAR),
        utf8(b"value_avatar"),
        0,
    );

    scenario_val.end();
}

#[test]
fun test_unset_user_data() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    setup(scenario, FIRST_ADDRESS, 0);

    set_user_data_util(
        scenario,
        FIRST_ADDRESS,
        utf8(AVATAR),
        utf8(b"value_avatar"),
        0,
    );
    unset_user_data_util(scenario, FIRST_ADDRESS, utf8(AVATAR), 0);
    let data = &get_user_data(scenario, utf8(DOMAIN_NAME));
    assert_eq(data.size(), 0);

    set_user_data_util(
        scenario,
        FIRST_ADDRESS,
        utf8(CONTENT_HASH),
        utf8(b"value_content_hash"),
        0,
    );
    set_user_data_util(
        scenario,
        FIRST_ADDRESS,
        utf8(AVATAR),
        utf8(b"value_avatar"),
        0,
    );
    unset_user_data_util(scenario, FIRST_ADDRESS, utf8(CONTENT_HASH), 0);
    let data = &get_user_data(scenario, utf8(DOMAIN_NAME));
    assert_eq(data.size(), 1);
    assert_eq(*data.get(&utf8(AVATAR)), utf8(b"value_avatar"));

    scenario_val.end();
}

#[test]
fun test_unset_user_data_works_if_key_not_exists() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    setup(scenario, FIRST_ADDRESS, 0);

    unset_user_data_util(scenario, FIRST_ADDRESS, utf8(AVATAR), 0);

    scenario_val.end();
}

#[test, expected_failure(abort_code = registry::ERecordExpired)]
fun test_unset_user_data_aborts_if_nft_expired() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    setup(scenario, FIRST_ADDRESS, 0);

    unset_user_data_util(scenario, FIRST_ADDRESS, utf8(AVATAR), 2 * year_ms());

    scenario_val.end();
}

#[test, expected_failure(abort_code = ::iota_names::iota_names::EAppNotAuthorized)]
fun test_unset_user_data_works_if_controller_is_deauthorized() {
    let mut scenario_val = test_init();
    let scenario = &mut scenario_val;
    setup(scenario, FIRST_ADDRESS, 0);

    deauthorize_app_util(scenario);
    unset_user_data_util(scenario, FIRST_ADDRESS, utf8(AVATAR), 0);

    scenario_val.end();
}
