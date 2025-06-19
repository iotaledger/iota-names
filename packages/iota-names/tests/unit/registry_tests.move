// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
#[allow(lint(abort_without_constant))]
module iota_names::registry_tests;

use iota::clock::{Self, Clock};
use iota::test_utils::assert_eq;
use iota::vec_map;
use iota_names::constants;
use iota_names::domain::{Self, Domain};
use iota_names::iota_names_registration::{Self as nft, IotaNamesRegistration};
use iota_names::name_record as record;
use iota_names::registry::{Self, Registry};
use std::option::{some, none};
use std::string::{String, utf8};

// === Registry + Record Addition ===

#[test]
fun test_registry() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, domain) = setup(&mut ctx);

    // create a record for the test domain with expiration set to 1 year
    let nft = registry.add_record(domain, 1, &clock, &mut ctx);

    // make sure that the nft matches the domain
    assert_eq(nft.domain(), domain);
    assert_eq(registry.has_record(nft.domain()), true);

    // take the record and compare it against the nft
    let record = registry.remove_record_for_testing(domain);
    assert_eq(record.expiration_timestamp_ms(), nft.expiration_timestamp_ms());

    burn_nfts(vector[nft]);
    wrapup(registry, clock);
}

#[test]
/// 1. Create a normal record that acts as a parent
/// 2. Add a leaf subdomain for that parent
/// 3. Validate valid scenarios of using that leaf_node.
fun test_leaf_records() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, domain) = setup(&mut ctx);

    // leaf subdomain to be added
    let subdomain_one = domain::new(utf8(b"test.hahaha.iota"));

    // create a record for the test domain with expiration set to 1 year
    let nft = registry.add_record(domain, 1, &clock, &mut ctx);

    // register a leaf record and set the target to @0x0
    registry.add_leaf_record(subdomain_one, &clock, @0x0, &mut ctx);

    // set the reverse_Registry of @0x0 to be that leaf subdomain
    registry.set_reverse_lookup(@0x0, subdomain_one);

    let name_record = option::extract(&mut registry.lookup(subdomain_one));
    // validate that the parent nft_id is the same as the leaf's one.
    assert_eq(object::id(&nft), name_record.nft_id());

    // Reverse lookup should work as expected, since it's set.
    let name = option::extract(&mut registry.reverse_lookup(@0x0));
    assert!(name == subdomain_one, 0);

    // remove leaf_record to test removal too
    registry.remove_leaf_record(subdomain_one);

    // validate that now @0x0 doesn't have a reverse lookup anymore.
    let res = registry::reverse_lookup(&registry, @0x0);
    assert!(option::is_none(&res), 0);

    burn_nfts(vector[nft]);
    wrapup_non_empty(registry, clock);
}

#[test]
/// Overrides a leaf record (by just adding it again) as a new domain owner,
/// while this leaf name existed before.
fun override_leaf_record_after_change_of_parent_owner() {
    let mut ctx = tx_context::dummy();
    let (mut registry, mut clock, _domain) = setup(&mut ctx);

    let nft = registry.add_record(
        domain::new(utf8(b"test.iota")),
        1,
        &clock,
        &mut ctx,
    );

    // add 2 leaf records as nft
    registry.add_leaf_record(
        domain::new(utf8(b"test.test.iota")),
        &clock,
        @0x0,
        &mut ctx,
    );
    registry.add_leaf_record(
        domain::new(utf8(b"test2.test.iota")),
        &clock,
        @0x0,
        &mut ctx,
    );

    // increment the clock to 1 years + grace period
    clock::increment_for_testing(
        &mut clock,
        constants::year_ms() + constants::grace_period_ms() + 1,
    );

    // become a new owner, `new_oner_nft`
    let new_owner_nft = registry.add_record(
        domain::new(utf8(b"test.iota")),
        1,
        &clock,
        &mut ctx,
    );

    // override both leaf records, one with a node subdomain, the other with a
    // leaf subdomain
    let normal_subdomain_override = registry.add_record_ignoring_grace_period(
        domain::new(utf8(b"test.test.iota")),
        1,
        &clock,
        &mut ctx,
    );
    registry.add_leaf_record(
        domain::new(utf8(b"test2.test.iota")),
        &clock,
        @0x1,
        &mut ctx,
    );

    burn_nfts(vector[nft, new_owner_nft, normal_subdomain_override]);
    wrapup_non_empty(registry, clock);
}

#[test]
/// 1. Create a registry, increment clock to 1 year;
/// 2. Increment the clock to 1 year so that the record is expired;
/// 3. Override the record and discard the old data;
fun test_registry_expired_override() {
    let mut ctx = tx_context::dummy();
    let (mut registry, mut clock, domain) = setup(&mut ctx);

    // create a record for the test domain with expiration set to 1 year
    let nft = registry.add_record(domain, 1, &clock, &mut ctx);

    // increment the clock to 1 years + grace period
    clock::increment_for_testing(
        &mut clock,
        constants::year_ms() + constants::grace_period_ms() + 1,
    );

    // override the record
    let nft_2 = registry.add_record(domain, 2, &clock, &mut ctx);
    let record = registry.remove_record_for_testing(domain);

    // make sure the old NFT is no longer matches to the domain
    assert!(object::id(&nft) != record::nft_id(&record), 0);

    assert_eq(
        nft::expiration_timestamp_ms(&nft_2),
        record::expiration_timestamp_ms(&record),
    );
    assert_eq(
        nft::expiration_timestamp_ms(&nft_2),
        clock::timestamp_ms(&clock) + (2 * constants::year_ms()),
    );

    wrapup(registry, clock);
    burn_nfts(vector[nft, nft_2])
}

#[test]
/// 1. Create a registry, increment clock to 1 year;
/// 2. Increment the clock to 1 year so that the record is expired, ignoring the
/// grace period
/// 3. Override the record and discard the old data;
fun test_registry_expired_without_grace_period_override() {
    let mut ctx = tx_context::dummy();
    let (mut registry, mut clock, domain) = setup(&mut ctx);

    // create a record for the test domain with expiration set to 1 year
    let nft = registry.add_record(domain, 1, &clock, &mut ctx);

    // increment the clock to 1 years + grace period
    clock::increment_for_testing(&mut clock, constants::year_ms() + 1);

    // override the record
    let nft_2 = registry.add_record_ignoring_grace_period(
        domain,
        2,
        &clock,
        &mut ctx,
    );
    let record = registry.remove_record_for_testing(domain);

    // make sure the old NFT is no longer matches to the domain
    assert!(object::id(&nft) != record::nft_id(&record), 0);

    assert_eq(
        nft::expiration_timestamp_ms(&nft_2),
        record::expiration_timestamp_ms(&record),
    );
    assert_eq(
        nft::expiration_timestamp_ms(&nft_2),
        clock::timestamp_ms(&clock) + (2 * constants::year_ms()),
    );

    wrapup(registry, clock);
    burn_nfts(vector[nft, nft_2])
}

#[test, expected_failure(abort_code = iota_names::registry::ERecordNotExpired)]
/// 1. Create a registry, increment clock to 1 year;
/// 2. Increment the clock to less than 1 year so that the record is expired;
/// 3. Try to override the record and fail - not expired;
fun test_registry_expired_override_fail() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, domain) = setup(&mut ctx);

    // create a record for the test domain with expiration set to 1 year
    let _nft = registry.add_record(domain, 1, &clock, &mut ctx);

    // try to override the record and fail - not expired
    let _nft = registry.add_record(domain, 1, &clock, &mut ctx);

    abort 1337
}

#[test, expected_failure(abort_code = iota_names::registry::ERecordNotExpired)]
/// Check that `add_record` preserves the
fun test_registry_grace_period() {
    let mut ctx = tx_context::dummy();
    let (mut registry, mut clock, domain) = setup(&mut ctx);

    // create a record for the test domain with expiration set to 1 year
    let _nft = registry.add_record(domain, 1, &clock, &mut ctx);
    // increment the clock to 1 years + grace period
    clock::increment_for_testing(&mut clock, constants::year_ms() + 1);
    // try to override the record and fail - not expired
    let _nft = registry.add_record(domain, 1, &clock, &mut ctx);

    abort 1337
}

// === Burn Names ===

#[test]
/// Checks that `burn_registration_object` burns `IotaNamesRegistration` object
/// but doesn't touch the NameRecord, as this name has been re-registered by a
/// different user (after its expiration).
fun test_registry_burn_name() {
    let mut ctx = tx_context::dummy();
    let (mut registry, mut clock, domain) = setup(&mut ctx);

    // create a record for the test domain with expiration set to 1 year
    let nft = registry.add_record(domain, 1, &clock, &mut ctx);

    // increment the clock to 1 years + grace period
    clock::increment_for_testing(
        &mut clock,
        constants::year_ms() + constants::grace_period_ms() + 1,
    );

    // we re-register the same domain now that the other has expired.
    let new_nft = registry.add_record(domain, 1, &clock, &mut ctx);

    // we burn the first one as it is an expired name now.
    registry.burn_registration_object(nft, &clock);

    // we still have a registry entry though, it's not removed as the owner is
    // different.
    assert!(option::is_some(&registry.lookup(domain)), 1);

    // remove the record so we can wrap this up.
    registry.remove_record_for_testing(domain);

    wrapup(registry, clock);
    burn_nfts(vector[new_nft]);
}

#[test]
/// `burn_registration_object` burns the IotaNamesRegistration object as well as
/// removes the record,
/// since it still points to the old owner.
fun test_registry_burn_name_and_removes_record() {
    let mut ctx = tx_context::dummy();
    let (mut registry, mut clock, domain) = setup(&mut ctx);

    // create a record for the test domain with expiration set to 1 year
    let nft = registry.add_record(domain, 1, &clock, &mut ctx);

    // increment the clock to 1 years + grace period
    clock::increment_for_testing(
        &mut clock,
        constants::year_ms() + constants::grace_period_ms() + 1,
    );

    // we burn the first one as it is an expired name now.
    registry.burn_registration_object(nft, &clock);

    // we still have a registry entry though, it's not removed as the owner is
    // different.
    assert!(option::is_none(&registry.lookup(domain)), 1);

    wrapup(registry, clock);
}

// === Target Address ===

#[test]
/// 1. Create a registry, add a record;
/// 2. Call `set_target_address` and make sure that the address is set;
/// 3. Check target address lookup; check that record has correct target;
fun set_target_address() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, domain) = setup(&mut ctx);

    // create a record for the test domain with expiration set to 1 year
    let nft = registry.add_record(domain, 1, &clock, &mut ctx);
    registry.set_target_address(domain, some(@0x2));

    // try to find a record and then get a record
    let mut search = registry.lookup(domain);
    let record = registry.remove_record_for_testing(domain);

    // make sure the search is a success
    assert!(option::is_some(&search), 0);
    assert_eq(option::extract(&mut search), record);
    assert_eq(record::target_address(&record), some(@0x2));

    wrapup(registry, clock);
    burn_nfts(vector[nft]);
}

// === Reverse Lookup ===

#[test]
/// 1. Create a registry, add a record;
/// 2. Call `set_target_address` and make sure that the address is set;
/// 3. Call `set_reverse_lookup` and make sure that reverse registry updated;
fun set_reverse_lookup() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, domain) = setup(&mut ctx);
    let nft = registry.add_record(domain, 1, &clock, &mut ctx);

    // set the `domain` points to @0x0; set the reverse lookup too
    registry.set_target_address(domain, some(@0xB0B));
    registry.set_reverse_lookup(@0xB0B, domain);

    // search for the reverse_lookup record
    let mut search = registry::reverse_lookup(&registry, @0xB0B);

    assert!(option::is_some(&search), 0);
    assert!(option::extract(&mut search) == domain, 0);

    // wrapup
    registry.unset_reverse_lookup(@0xB0B);
    let _ = registry.remove_record_for_testing(domain);

    wrapup(registry, clock);
    burn_nfts(vector[nft]);
}

#[test]
fun burn_expired_subdomain() {
    let mut ctx = tx_context::dummy();
    let (mut registry, mut clock, _domain) = setup(&mut ctx);

    let nft = registry.add_record(
        domain::new(utf8(b"node.test.iota")),
        1,
        &clock,
        &mut ctx,
    );

    let subdomain = registry.wrap_subdomain(nft, &clock, &mut ctx);

    clock::increment_for_testing(&mut clock, constants::year_ms() + 1);

    registry.burn_subdomain_object(subdomain, &clock);

    wrapup(registry, clock);
}

#[test]
fun burn_expired_iota_names_registration() {
    let mut ctx = tx_context::dummy();
    let (mut registry, mut clock, domain) = setup(&mut ctx);
    let nft = registry.add_record(domain, 1, &clock, &mut ctx);
    // increment the clock to 1 years + grace period
    clock::increment_for_testing(&mut clock, constants::year_ms() + 1);

    // burn the registration object
    registry.burn_registration_object(nft, &clock);

    let name = registry.lookup(domain);
    assert!(option::is_none(&name), 0);

    wrapup(registry, clock);
}

#[test]
fun burn_expired_registration_without_overriding() {
    let mut ctx = tx_context::dummy();
    let (mut registry, mut clock, domain) = setup(&mut ctx);
    let nft = registry.add_record(domain, 1, &clock, &mut ctx);
    // increment the clock to 1 years + grace period
    clock::increment_for_testing(
        &mut clock,
        constants::year_ms() + constants::grace_period_ms() + 1,
    );

    // re-register
    let new_nft_post_expiration = registry.add_record(
        domain,
        1,
        &clock,
        &mut ctx,
    );

    // burn the expired object
    registry.burn_registration_object(nft, &clock);

    // Validate that the record still exists (no invalidation happened),
    // since the name was bought again after this.
    let name = registry.lookup(domain);
    assert!(option::is_some(&name), 0);

    wrapup_non_empty(registry, clock);
    burn_nfts(vector[new_nft_post_expiration]);
}

#[test, expected_failure(abort_code = iota_names::registry::ETargetNotSet)]
/// 1. Create a registry, add a record;
/// 2. Try calling `set_reverse_lookup` and fail
fun set_reverse_lookup_fail_target_not_set() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, domain) = setup(&mut ctx);
    let _nft = registry.add_record(domain, 1, &clock, &mut ctx);

    // set the `domain` points to @0x0
    registry.set_reverse_lookup(@0x0, domain);

    abort 1337
}

#[test, expected_failure(abort_code = iota_names::registry::ERecordMismatch)]
/// 1. Create a registry, add a record;
/// 2. Set target_address to address Alice
/// 2. Try calling `set_reverse_lookup` and use address Bob
fun set_reverse_lookup_fail_record_mismatch() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, domain) = setup(&mut ctx);
    let _nft = registry.add_record(domain, 1, &clock, &mut ctx);

    // set the `domain` points to @0x0
    registry.set_target_address(domain, some(@0xB0B));
    registry.set_reverse_lookup(@0xA11CE, domain);

    abort 1337
}

#[test, expected_failure(abort_code = iota_names::registry::EInvalidDepth)]
/// Attempt to add a SLD record as a `leaf` record.
fun add_sld_as_leaf_record_failure() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, _domain) = setup(&mut ctx);

    registry.add_leaf_record(
        domain::new(utf8(b"test.iota")),
        &clock,
        @0x0,
        &mut ctx,
    );

    abort 1337
}

#[test, expected_failure(abort_code = iota_names::registry::ERecordNotFound)]
/// Attempt to add a leaf record without a valid parent existing.
fun add_leaf_record_without_valid_parent_failure() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, _domain) = setup(&mut ctx);

    registry.add_leaf_record(
        domain::new(utf8(b"test.test.iota")),
        &clock,
        @0x0,
        &mut ctx,
    );

    abort 1337
}

#[test, expected_failure(abort_code = iota_names::registry::ENonLeafRecord)]
/// Attempts to remove a non leaf record.
fun remove_non_leaf_record_failure() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, _domain) = setup(&mut ctx);

    let _nft = registry.add_record(
        domain::new(utf8(b"test.test.iota")),
        1,
        &clock,
        &mut ctx,
    );

    registry.remove_leaf_record(domain::new(utf8(b"test.test.iota")));

    abort 1337
}

#[test, expected_failure(abort_code = iota_names::registry::ERecordNotExpired)]
/// Tries to add a `leaf` record on-top of an existing subdomain (fails).
fun try_to_override_existing_node_subdomain() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, _domain) = setup(&mut ctx);

    let _nft = registry.add_record(
        domain::new(utf8(b"test.iota")),
        1,
        &clock,
        &mut ctx,
    );
    let _existing = registry.add_record(
        domain::new(utf8(b"test.test.iota")),
        1,
        &clock,
        &mut ctx,
    );

    registry.add_leaf_record(
        domain::new(utf8(b"test.test.iota")),
        &clock,
        @0x0,
        &mut ctx,
    );

    abort 1337
}

#[test, expected_failure(abort_code = iota_names::registry::ERecordNotExpired)]
/// Tries to add a `node` record on-top of an existing subdomain (fails).
fun try_to_override_existing_leaf_subdomain() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, _domain) = setup(&mut ctx);

    let _nft = registry.add_record(
        domain::new(utf8(b"test.iota")),
        1,
        &clock,
        &mut ctx,
    );

    registry.add_leaf_record(
        domain::new(utf8(b"test.test.iota")),
        &clock,
        @0x0,
        &mut ctx,
    );

    let _existing = registry.add_record_ignoring_grace_period(
        domain::new(utf8(b"test.test.iota")),
        1,
        &clock,
        &mut ctx,
    );

    abort 1337
}

#[test, expected_failure(abort_code = iota_names::registry::ERecordNotExpired)]
fun burn_non_expired_domain_failure() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, domain) = setup(&mut ctx);
    let nft = registry.add_record(domain, 1, &clock, &mut ctx);

    // burn the expired object
    registry.burn_registration_object(nft, &clock);

    abort 1337
}

// === XXX ===

// === Helpers ===

fun setup(ctx: &mut TxContext): (Registry, Clock, Domain) {
    (
        registry::new_for_testing(ctx),
        clock::create_for_testing(ctx),
        domain::new(utf8(b"hahaha.iota")),
    )
}

fun wrapup(registry: Registry, clock: Clock) {
    registry::destroy_empty_for_testing(registry);
    clock.destroy_for_testing();
}

fun wrapup_non_empty(registry: Registry, clock: Clock) {
    registry::destroy_for_testing(registry);
    clock.destroy_for_testing();
}

#[test_only]
public fun burn_nfts(mut nfts: vector<IotaNamesRegistration>) {
    while (vector::length(&nfts) > 0) {
        nft::burn_for_testing(vector::pop_back(&mut nfts));
    };
    vector::destroy_empty(nfts);
}

#[test]
fun test_set_expiration_timestamp_ms() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, domain) = setup(&mut ctx);

    // Create a record for the test domain with expiration set to 1 year
    let mut nft = registry.add_record(domain, 1, &clock, &mut ctx);
    
    let new_expiration = 5 * constants::year_ms();
    registry.set_expiration_timestamp_ms(&mut nft, domain, new_expiration);

    // Verify both the NFT and the registry record have been updated
    assert_eq(nft.expiration_timestamp_ms(), new_expiration);
    
    let record_option = registry.lookup(domain);
    assert!(record_option.is_some(), 0);
    let record = record_option.destroy_some();
    assert_eq(record.expiration_timestamp_ms(), new_expiration);

    // Clean up
    let _ = registry.remove_record_for_testing(domain);
    burn_nfts(vector[nft]);
    wrapup(registry, clock);
}

#[test, expected_failure(abort_code = iota_names::registry::EIdMismatch)]
fun test_set_expiration_timestamp_ms_nft_mismatch() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, domain) = setup(&mut ctx);

    // Create two different records
    let mut nft1 = registry.add_record(domain, 1, &clock, &mut ctx);
    let domain2 = domain::new(utf8(b"other.iota"));
    let _nft2 = registry.add_record(domain2, 1, &clock, &mut ctx);

    // Try to update domain with wrong NFT (should fail)
    registry.set_expiration_timestamp_ms(&mut nft1, domain2, 5 * constants::year_ms());

    abort 1337
}

#[test]
fun test_set_and_get_data() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, domain) = setup(&mut ctx);

    // Create a record for the test domain
    let nft = registry.add_record(domain, 1, &clock, &mut ctx);

    // Test with empty data initially
    let initial_data = registry.get_data(domain);
    assert_eq(initial_data.size(), 0);

    // Create some test data
    let mut test_data = vec_map::empty<String, String>();
    test_data.insert(utf8(b"avatar"), utf8(b"avatar_url"));
    test_data.insert(utf8(b"email"), utf8(b"test@example.com"));
    test_data.insert(utf8(b"website"), utf8(b"https://example.com"));

    // Set the data
    registry.set_data(domain, test_data);

    // Verify the data was set correctly
    let retrieved_data = registry.get_data(domain);
    assert_eq(retrieved_data.size(), 3);
    assert_eq(*retrieved_data.get(&utf8(b"avatar")), utf8(b"avatar_url"));
    assert_eq(*retrieved_data.get(&utf8(b"email")), utf8(b"test@example.com"));
    assert_eq(*retrieved_data.get(&utf8(b"website")), utf8(b"https://example.com"));

    // Update with new data
    let mut updated_data = vec_map::empty<String, String>();
    updated_data.insert(utf8(b"avatar"), utf8(b"new_avatar_url"));
    updated_data.insert(utf8(b"bio"), utf8(b"My bio"));

    registry.set_data(domain, updated_data);

    // Verify the data was updated (should replace, not merge)
    let final_data = registry.get_data(domain);
    assert_eq(final_data.size(), 2);
    assert_eq(*final_data.get(&utf8(b"avatar")), utf8(b"new_avatar_url"));
    assert_eq(*final_data.get(&utf8(b"bio")), utf8(b"My bio"));

    // Clean up
    let _ = registry.remove_record_for_testing(domain);
    burn_nfts(vector[nft]);
    wrapup(registry, clock);
}

#[test]
/// Test `assert_nft_is_authorized` function with valid NFT
fun test_assert_nft_is_authorized_success() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, domain) = setup(&mut ctx);

    // Create a record for the test domain
    let nft = registry.add_record(domain, 1, &clock, &mut ctx);

    // This should succeed - NFT matches record and hasn't expired
    registry.assert_nft_is_authorized(&nft, &clock);

    // Clean up
    let _ = registry.remove_record_for_testing(domain);
    burn_nfts(vector[nft]);
    wrapup(registry, clock);
}

#[test, expected_failure(abort_code = iota_names::registry::EIdMismatch)]
fun test_assert_nft_is_authorized_id_mismatch() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, domain) = setup(&mut ctx);

    // create two different records
    let nft1 = registry.add_record(domain, 1, &clock, &mut ctx);

    // Override the first domain with a new NFT
    let mut clock_temp = clock;
    clock::increment_for_testing(&mut clock_temp, constants::year_ms() + constants::grace_period_ms() + 1);
    let _nft3 = registry.add_record(domain, 1, &clock_temp, &mut ctx);

    // Now assert with the old NFT should fail
    registry.assert_nft_is_authorized(&nft1, &clock_temp);

    abort 1337
}

#[test, expected_failure(abort_code = iota_names::registry::ERecordExpired)]
fun test_assert_nft_is_authorized_record_expired() {
    let mut ctx = tx_context::dummy();
    let (mut registry, mut clock, domain) = setup(&mut ctx);

    // create a record for the test domain
    let nft = registry.add_record(domain, 1, &clock, &mut ctx);

    // Move time forward so the record expires
    clock::increment_for_testing(&mut clock, constants::year_ms() + 1);

    // This should fail - record has expired
    registry.assert_nft_is_authorized(&nft, &clock);

    abort 1337
}

#[test]
fun test_update_existing_reverse_lookup() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, domain) = setup(&mut ctx);
    
    let nft = registry.add_record(domain, 1, &clock, &mut ctx);
    let domain2 = domain::new(utf8(b"second.iota"));
    let nft2 = registry.add_record(domain2, 1, &clock, &mut ctx);

    let target_addr = @0xB0B;

    // Set target address for both domains
    registry.set_target_address(domain, some(target_addr));
    registry.set_target_address(domain2, some(target_addr));

    // Set reverse lookup to first domain
    registry.set_reverse_lookup(target_addr, domain);
    let lookup_result = registry.reverse_lookup(target_addr);
    assert_eq(lookup_result, some(domain));

    // Update reverse lookup to second domain
    registry.set_reverse_lookup(target_addr, domain2);
    let lookup_result = registry.reverse_lookup(target_addr);
    assert_eq(lookup_result, some(domain2));

    // Clean up
    registry.unset_reverse_lookup(target_addr);
    let _ = registry.remove_record_for_testing(domain);
    let _ = registry.remove_record_for_testing(domain2);

    wrapup(registry, clock);
    burn_nfts(vector[nft, nft2]);
}

#[test]
fun test_has_record() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, domain) = setup(&mut ctx);

    // Initially no record should exist
    assert_eq(registry.has_record(domain), false);

    // Add a record
    let nft = registry.add_record(domain, 1, &clock, &mut ctx);
    assert_eq(registry.has_record(domain), true);

    // Remove the record
    let _ = registry.remove_record_for_testing(domain);
    assert_eq(registry.has_record(domain), false);

    burn_nfts(vector[nft]);
    wrapup(registry, clock);
}

#[test]
fun test_lookup_nonexistent() {
    let mut ctx = tx_context::dummy();
    let (registry, clock, _domain) = setup(&mut ctx);

    // Test lookup for a domain that doesn't exist
    let nonexistent_domain = domain::new(utf8(b"nonexistent.iota"));
    let result = registry.lookup(nonexistent_domain);
    assert!(result.is_none(), 0);

    wrapup(registry, clock);
}

#[test]
fun test_reverse_lookup_nonexistent() {
    let mut ctx = tx_context::dummy();
    let (registry, clock, _domain) = setup(&mut ctx);

    // Test reverse lookup for an address that doesn't have a mapping
    let result = registry.reverse_lookup(@0x999);
    assert!(result.is_none(), 0);

    wrapup(registry, clock);
}

#[test]
fun test_unset_target_address() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, domain) = setup(&mut ctx);

    let nft = registry.add_record(domain, 1, &clock, &mut ctx);
    
    // Set a target address first
    registry.set_target_address(domain, some(@0x123));
    let record = registry.lookup(domain).destroy_some();
    assert_eq(record.target_address(), some(@0x123));

    // Now unset it
    registry.set_target_address(domain, none());
    let record = registry.lookup(domain).destroy_some();
    assert_eq(record.target_address(), none());

    let _ = registry.remove_record_for_testing(domain);
    burn_nfts(vector[nft]);
    wrapup(registry, clock);
}

#[test]
fun test_reverse_record_invalidation_on_target_change() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, domain) = setup(&mut ctx);

    let nft = registry.add_record(domain, 1, &clock, &mut ctx);
    let addr1 = @0x111;
    let addr2 = @0x222;

    // Set target to addr1 and set reverse lookup
    registry.set_target_address(domain, some(addr1));
    registry.set_reverse_lookup(addr1, domain);
    assert_eq(registry.reverse_lookup(addr1), some(domain));

    // Change target to addr2 - should invalidate reverse lookup for addr1
    registry.set_target_address(domain, some(addr2));
    assert_eq(registry.reverse_lookup(addr1), none());

    // Set reverse lookup for addr2
    registry.set_reverse_lookup(addr2, domain);
    assert_eq(registry.reverse_lookup(addr2), some(domain));

    // Unset target address - should invalidate reverse lookup for addr2
    registry.set_target_address(domain, none());
    assert_eq(registry.reverse_lookup(addr2), none());

    let _ = registry.remove_record_for_testing(domain);
    burn_nfts(vector[nft]);
    wrapup(registry, clock);
}

#[test]
fun test_reverse_record_invalidation_different_domain() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, domain) = setup(&mut ctx);

    let nft1 = registry.add_record(domain, 1, &clock, &mut ctx);
    let domain2 = domain::new(utf8(b"other.iota"));
    let nft2 = registry.add_record(domain2, 1, &clock, &mut ctx);
    
    let shared_addr = @0x123;

    // Set both domains to point to the same address
    registry.set_target_address(domain, some(shared_addr));
    registry.set_target_address(domain2, some(shared_addr));

    // Set reverse lookup to domain2
    registry.set_reverse_lookup(shared_addr, domain2);
    assert_eq(registry.reverse_lookup(shared_addr), some(domain2));

    // Changing domain1's target should not affect the reverse lookup since it points to domain2
    registry.set_target_address(domain, none());
    assert_eq(registry.reverse_lookup(shared_addr), some(domain2));

    // But changing domain2's target should invalidate it
    registry.set_target_address(domain2, none());
    assert_eq(registry.reverse_lookup(shared_addr), none());

    let _ = registry.remove_record_for_testing(domain);
    let _ = registry.remove_record_for_testing(domain2);
    burn_nfts(vector[nft1, nft2]);
    wrapup(registry, clock);
}

#[test]
fun test_set_same_target_address() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, domain) = setup(&mut ctx);

    let nft = registry.add_record(domain, 1, &clock, &mut ctx);
    let target_addr = @0x123;
    
    // Set target address
    registry.set_target_address(domain, some(target_addr));
    registry.set_reverse_lookup(target_addr, domain);
    
    // Set the same target address again (should not change reverse lookup)
    registry.set_target_address(domain, some(target_addr));
    assert_eq(registry.reverse_lookup(target_addr), some(domain));

    // Clean up
    registry.unset_reverse_lookup(target_addr);
    let _ = registry.remove_record_for_testing(domain);
    burn_nfts(vector[nft]);
    wrapup(registry, clock);
}

#[test, expected_failure(abort_code = iota_names::registry::ERecordExpired)]
fun test_add_leaf_record_parent_expired() {
    let mut ctx = tx_context::dummy();
    let (mut registry, mut clock, domain) = setup(&mut ctx);

    // Create a parent record
    let nft = registry.add_record(domain, 1, &clock, &mut ctx);
    
    // Create subdomain
    let subdomain = domain::new(utf8(b"sub.hahaha.iota"));
    
    // Move time forward so parent expires
    clock::increment_for_testing(&mut clock, constants::year_ms() + 1);
    
    // Try to add leaf record with expired parent (should fail)
    registry.add_leaf_record(subdomain, &clock, @0x123, &mut ctx);

    burn_nfts(vector[nft]);
    abort 1337
}

#[test, expected_failure(abort_code = iota_names::registry::ENftExpired)]
fun test_assert_nft_is_authorized_nft_expired() {
    let mut ctx = tx_context::dummy();
    let (mut registry, mut clock, domain) = setup(&mut ctx);

    // create a record for the test domain with 1 year expiration
    let mut nft = registry.add_record(domain, 1, &clock, &mut ctx);
    
    // First extend both NFT and record to 5 years
    let long_expiration = clock.timestamp_ms() + (5 * constants::year_ms());
    registry.set_expiration_timestamp_ms(&mut nft, domain, long_expiration);
    
    // Now manually set the NFT expiration to be much shorter using the testing function
    let short_expiration = clock.timestamp_ms() + 1000; // expires very soon
    nft.set_expiration_timestamp_ms_for_testing(short_expiration);
    
    // Move time forward so the NFT expires but the record is still valid
    clock::increment_for_testing(&mut clock, 2000);
    
    // This should fail with ENftExpired - the record is valid but the NFT has expired
    registry.assert_nft_is_authorized(&nft, &clock);

    burn_nfts(vector[nft]);
    abort 1337
}

#[test]
fun test_remove_leaf_record_covers_is_leaf_record() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, domain) = setup(&mut ctx);

    // Create a parent record
    let nft = registry.add_record(domain, 1, &clock, &mut ctx);
    
    // Create a leaf record under the parent
    let subdomain = domain::new(utf8(b"leaf.hahaha.iota"));
    registry.add_leaf_record(subdomain, &clock, @0x123, &mut ctx);

    // Remove the leaf record (this will internally call is_leaf_record and cover the true case)
    registry.remove_leaf_record(subdomain);

    // Verify it was removed
    assert!(registry.lookup(subdomain).is_none(), 0);

    let _ = registry.remove_record_for_testing(domain);
    burn_nfts(vector[nft]);
    wrapup(registry, clock);
}

#[test, expected_failure(abort_code = iota_names::registry::ENonLeafRecord)]
fun test_remove_leaf_record_nonexistent() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, _domain) = setup(&mut ctx);

    // Create a subdomain that doesn't exist in registry
    let nonexistent_subdomain = domain::new(utf8(b"nonexistent.hahaha.iota"));

    // Try to remove non-existent subdomain as leaf record - should fail (covers is_leaf_record return false for non-existent)
    registry.remove_leaf_record(nonexistent_subdomain);

    wrapup(registry, clock);
    abort 1337
}

#[test, expected_failure(abort_code = iota_names::registry::ENonLeafRecord)]
fun test_remove_leaf_record_non_leaf() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, domain) = setup(&mut ctx);

    // Create a regular SLD record (not a leaf)
    let _nft = registry.add_record(domain, 1, &clock, &mut ctx);

    // Try to remove it as a leaf record - should fail
    registry.remove_leaf_record(domain);

    abort 1337
}

#[test, expected_failure(abort_code = iota_names::registry::ERecordNotExpired)]
fun test_leaf_record_parent_same_nft_not_expired() {
    let mut ctx = tx_context::dummy();
    let (mut registry, clock, _domain) = setup(&mut ctx);

    // Create a parent domain
    let parent_domain = domain::new(utf8(b"parent.iota"));
    let _nft = registry.add_record(parent_domain, 1, &clock, &mut ctx);

    // Create a leaf record under the parent
    let leaf_domain = domain::new(utf8(b"leaf.parent.iota"));
    registry.add_leaf_record(leaf_domain, &clock, @0x123, &mut ctx);

    // Try to override the leaf record by adding a new record with the same domain
    // This should fail because the parent (which shares the same NFT ID) hasn't expired
    let _new_nft = registry.add_record_ignoring_grace_period(leaf_domain, 1, &clock, &mut ctx);

    abort 1337
}

#[test]
/// Test the case where a leaf record's parent has a different NFT ID (parent was transferred/re-registered)
fun test_leaf_record_parent_different_nft_id() {
    let mut ctx = tx_context::dummy();
    let (mut registry, mut clock, _domain) = setup(&mut ctx);

    // Create a parent domain
    let parent_domain = domain::new(utf8(b"parent.iota"));
    let nft1 = registry.add_record(parent_domain, 1, &clock, &mut ctx);

    // Create a leaf record under the parent
    let leaf_domain = domain::new(utf8(b"leaf.parent.iota"));
    registry.add_leaf_record(leaf_domain, &clock, @0x123, &mut ctx);

    // Simulate the parent being expired and re-registered with a different NFT ID
    // First advance time to make the parent expire past grace period
    clock.increment_for_testing(constants::year_ms() + constants::grace_period_ms() + 1);
    
    // Burn the old NFT (simulating transfer or expiration)
    burn_nfts(vector[nft1]);
    
    // Re-register the parent domain (this will have a different NFT ID)
    let _nft2 = registry.add_record(parent_domain, 1, &clock, &mut ctx);

    // Now try to add a new record at the leaf domain
    // This should succeed because the parent NFT ID has changed and the old record can be removed
    let _new_leaf_nft = registry.add_record_ignoring_grace_period(leaf_domain, 1, &clock, &mut ctx);

    // Clean up the leaf record first
    let _leaf_record = registry.remove_record_for_testing(leaf_domain);
    let _parent_record = registry.remove_record_for_testing(parent_domain);

    // Clean up
    burn_nfts(vector[_nft2, _new_leaf_nft]);
    wrapup(registry, clock);
}

#[test]
/// Test leaf record removal when parent exists but has different NFT ID (the else path)
fun test_leaf_record_parent_different_nft_id_else_path() {
    let mut ctx = tx_context::dummy();
    let (mut registry, mut clock, _domain) = setup(&mut ctx);

    // Create a parent domain
    let parent_domain = domain::new(utf8(b"parent.iota"));
    let nft1 = registry.add_record(parent_domain, 1, &clock, &mut ctx);

    // Create a leaf record under the parent
    let leaf_domain = domain::new(utf8(b"leaf.parent.iota"));
    registry.add_leaf_record(leaf_domain, &clock, @0x123, &mut ctx);

    // Advance time to make parent expire past grace period
    clock.increment_for_testing(constants::year_ms() + constants::grace_period_ms() + 1);
    
    // Burn the old NFT and remove the parent record
    let _parent_record = registry.remove_record_for_testing(parent_domain);
    burn_nfts(vector[nft1]);
    
    // Re-register the parent domain with a different NFT ID (after expiration)
    let _nft2 = registry.add_record(parent_domain, 1, &clock, &mut ctx);

    // Now try to add a new record at the leaf domain
    // This should succeed because the parent NFT ID has changed (not equal condition)
    let _new_leaf_nft = registry.add_record_ignoring_grace_period(leaf_domain, 1, &clock, &mut ctx);

    // Clean up
    let _leaf_record = registry.remove_record_for_testing(leaf_domain);
    let _parent_record = registry.remove_record_for_testing(parent_domain);
    burn_nfts(vector[_nft2, _new_leaf_nft]);
    wrapup(registry, clock);
}

#[test]
fun test_add_leaf_record_no_parent() {
    let mut ctx = tx_context::dummy();
    let (mut registry, mut clock, _domain) = setup(&mut ctx);

    // Create a parent domain
    let parent_domain = domain::new(utf8(b"parent.iota"));
    let nft1 = registry.add_record(parent_domain, 1, &clock, &mut ctx);

    // Create a leaf record under the parent
    let leaf_domain = domain::new(utf8(b"leaf.parent.iota"));
    registry.add_leaf_record(leaf_domain, &clock, @0x123, &mut ctx);

    // Advance time to make parent expire past grace period
    clock.increment_for_testing(constants::year_ms() + constants::grace_period_ms() + 1);
    
    // Burn the NFT and completely remove the parent record
    registry.burn_registration_object(nft1, &clock);

    // Now the parent should not exist at all
    assert!(registry.lookup(parent_domain).is_none(), 0);

    // Now try to add a new record at the leaf domain
    let _new_leaf_nft = registry.add_record_ignoring_grace_period(leaf_domain, 1, &clock, &mut ctx);

    // Clean up
    let _leaf_record = registry.remove_record_for_testing(leaf_domain);
    burn_nfts(vector[_new_leaf_nft]);
    wrapup(registry, clock);
}

#[test]
fun test_leaf_record_parent_removed_after_creation() {
    let mut ctx = tx_context::dummy();
    let (mut registry, mut clock, _domain) = setup(&mut ctx);

    // Create a parent domain
    let parent_domain = domain::new(utf8(b"parent.iota"));
    let parent_nft = registry.add_record(parent_domain, 1, &clock, &mut ctx);

    // Create a leaf record under the parent
    let leaf_domain = domain::new(utf8(b"leaf.parent.iota"));
    registry.add_leaf_record(leaf_domain, &clock, @0x123, &mut ctx);

    // Verify the leaf record exists and parent exists
    assert!(registry.has_record(leaf_domain), 0);
    assert!(registry.has_record(parent_domain), 0);

    // Wait for parent to expire
    clock.increment_for_testing(constants::year_ms() + 1);

    // Now try to create a new record at the leaf domain
    // This will call remove_existing_record_if_exists_and_expired
    let new_leaf_nft = registry.add_record_ignoring_grace_period(leaf_domain, 1, &clock, &mut ctx);

    // Verify the new record was created
    assert!(registry.has_record(leaf_domain), 0);

    // Clean up
    registry.burn_registration_object(parent_nft, &clock);
    let _leaf_record = registry.remove_record_for_testing(leaf_domain);
    burn_nfts(vector[new_leaf_nft]);
    wrapup(registry, clock);
}
