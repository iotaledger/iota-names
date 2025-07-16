// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

module iota_names::registry;

use iota::event;
use iota::clock::Clock;
use iota::table::{Self, Table};
use iota::vec_map::VecMap;
use iota_names::name::Name;
use iota_names::iota_names::AdminCap;
use iota_names::name_registration::{Self as nft, NameRegistration};
use iota_names::name_record::{Self, NameRecord};
use iota_names::subname_registration::{Self, SubnameRegistration};
use std::option::{none, some};
use std::string::String;

#[error]
const ENftExpired: vector<u8> = b"The `NameRegistration` has expired.";
#[error]
const ERecordNotExpired: vector<u8> = b"Record has not yet expired.";
#[error]
const EIdMismatch: vector<u8> = b"The `NameRegistration` does not match the `NameRecord`.";
#[error]
const ERecordExpired: vector<u8> = b"The `NameRecord` has expired.";
#[error]
const ERecordMismatch: vector<u8> = b"The reverse lookup record does not match the `NameRecord`.";
#[error]
const ETargetNotSet: vector<u8> =
    b"Trying to add a reverse lookup record while the target is empty.";
#[error]
const ENonLeafRecord: vector<u8> =
    b"Trying to remove or operate on a non-leaf record as if it were a leaf record.";
#[error]
const EInvalidDepth: vector<u8> = b"Trying to add a leaf record for a TLN or SLN.";
#[error]
const ERecordNotFound: vector<u8> = b"Trying to lookup a record that doesn't exist.";

/// The `Registry` object. Attached as a dynamic field to the `IotaNames` object,
/// and the `iota_names` module controls the access to the `Registry`.
///
/// Contains two tables necessary for the lookup.
public struct Registry has store {
    /// The `registry` table maps `Name` to `NameRecord`.
    /// Added / replaced in the `add_record` function.
    registry: Table<Name, NameRecord>,
    /// The `reverse_registry` table maps `address` to `name`.
    /// Updated in the `set_reverse_lookup` function.
    reverse_registry: Table<address, Name>,
}

public struct NameRecordAddedEvent has copy, drop {
    name: Name,
    name_record: NameRecord
}

public struct NameRecordRemovedEvent has copy, drop {
    name: Name,
}

public struct TargetAddressSetEvent has copy, drop {
    name: Name,
    target_address: Option<address>
}

public struct ReverseLookupSetEvent has copy, drop {
    default_address: address,
    default_name: Name
}

public struct ReverseLookupUnsetEvent has copy, drop {
    default_address: address,
    default_name: Name
}

public fun new(_: &AdminCap, ctx: &mut TxContext): Registry {
    Registry {
        registry: table::new(ctx),
        reverse_registry: table::new(ctx),
    }
}

/// Attempts to add a new record to the registry without looking at the grace
/// period.
/// Currently used for subnames where there's no grace period to respect.
/// Returns a `NameRegistration` upon success.
public fun add_record_ignoring_grace_period(
    self: &mut Registry,
    name: Name,
    no_years: u8,
    clock: &Clock,
    ctx: &mut TxContext,
): NameRegistration {
    self.internal_add_record(name, no_years, clock, false, ctx)
}

/// Attempts to add a new record to the registry and returns a
/// `NameRegistration` upon success.
/// Only use with second-level names. Enforces a `grace_period` by default.
/// Not suitable for subnames (unless a grace period is needed).
public fun add_record(
    self: &mut Registry,
    name: Name,
    no_years: u8,
    clock: &Clock,
    ctx: &mut TxContext,
): NameRegistration {
    self.internal_add_record(name, no_years, clock, true, ctx)
}

/// Attempts to burn an NFT and get storage rebates.
/// Only works if the NFT has expired.
public fun burn_registration_object(
    self: &mut Registry,
    nft: NameRegistration,
    clock: &Clock,
) {
    // First we make sure that the NameRegistration object has expired.
    assert!(nft.has_expired(clock), ERecordNotExpired);

    let name = nft.name();

    // Then, if the registry still has a record for this name and the NFT ID
    // matches, we remove it.
    if (self.registry.contains(name)) {
        let record = &self.registry[name];

        // We wanna remove the record only if the NFT ID matches.
        if (record.nft_id() == object::id(&nft)) {
            event::emit(NameRecordRemovedEvent {
                name,
            });
            let record = self.registry.remove(name);
            self.handle_invalidate_reverse_record(
                &name,
                record.target_address(),
                none(),
            );
        }
    };
    // burn the NFT.
    nft.burn();
}

/// Allow creation of subname wrappers only to authorized modules.
public fun wrap_subname(
    _: &mut Registry,
    nft: NameRegistration,
    clock: &Clock,
    ctx: &mut TxContext,
): SubnameRegistration {
    subname_registration::new(nft, clock, ctx)
}

/// Attempts to burn a subname registration object,
/// and also invalidates any records in the registry / reverse registry.
public fun burn_subname_object(self: &mut Registry, nft: SubnameRegistration, clock: &Clock) {
    let nft = nft.burn(clock);
    self.burn_registration_object(nft, clock);
}

/// Adds a `leaf` record to the registry.
/// A `leaf` record is a record that is a subname and doesn't have
/// an equivalent `NameRegistration` object.
///
/// Instead, the parent's `NameRegistration` object is used to manage
/// target_address & remove it / determine expiration.
///
/// 1. Leaf records can't have children. They only work as a resolving
/// mechanism.
/// 2. Leaf records must always have a `target` address (can't point to `none`).
/// 3. Leaf records do not expire. Their expiration date is actually what
/// defines their type.
///
/// Leaf record's expiration is defined by the parent's expiration. Since the
/// parent can only be a `node`,
/// we need to check that the parent's NFT_ID is valid & hasn't expired.
public fun add_leaf_record(
    self: &mut Registry,
    name: Name,
    clock: &Clock,
    target: address,
    _ctx: &mut TxContext,
) {
    assert!(name.is_subname(), EInvalidDepth);

    // Get the parent of the name.
    let parent = name.parent().extract();
    let option_parent_name_record = self.lookup(parent);

    assert!(option_parent_name_record.is_some(), ERecordNotFound);

    // Finds existing parent record.
    let parent_name_record = option_parent_name_record.borrow();

    // Make sure that the parent isn't expired (because leaf record is invalid
    // in that case).
    // Ignores grace period is it's only there so you don't accidently forget to
    // renew your name.
    assert!(!parent_name_record.has_expired(clock), ERecordExpired);

    // Removes an existing record if it exists and is expired.
    self.remove_existing_record_if_exists_and_expired(name, clock, false);

    let name_record = name_record::new_leaf(parent_name_record.nft_id(), some(target));

    event::emit(NameRecordAddedEvent {
        name,
        name_record
    });

    // Adds the `leaf` record to the registry.
    self
        .registry
        .add(
            name,
            name_record
        );
}

/// Can be used to remove a leaf record.
/// Leaf records do not have any symmetrical `NameRegistration` object.
/// Authorization of who calls this is delegated to the authorized module that
/// calls this.
public fun remove_leaf_record(self: &mut Registry, name: Name) {
    // We can only call remove on a leaf record.
    assert!(self.is_leaf_record(name), ENonLeafRecord);

    // If it's a leaf record, there's no `NameRegistration` object.
    // We can just go ahead and remove the name_record, and invalidate the
    // reverse record (if any).
    event::emit(NameRecordRemovedEvent {
        name,
    });
    let record = self.registry.remove(name);
    let old_target_address = record.target_address();

    self.handle_invalidate_reverse_record(&name, old_target_address, none());
}

/// Forcefully remove any record by name.
/// This bypasses all expiration and authorization checks.
/// Should only be called by admin functions.
public(package) fun force_remove_record(self: &mut Registry, name: Name) {
    // Check if the record exists before trying to remove it
    if (!self.registry.contains(name)) {
        return
    };

    event::emit(NameRecordRemovedEvent {
        name,
    });
    
    let record = self.registry.remove(name);
    let old_target_address = record.target_address();

    // Invalidate any reverse lookup entries
    self.handle_invalidate_reverse_record(&name, old_target_address, none());
}

public fun set_target_address(self: &mut Registry, name: Name, new_target: Option<address>) {
    let record = &mut self.registry[name];
    let old_target = record.target_address();

    event::emit(TargetAddressSetEvent {
        name,
        target_address: new_target
    });

    record.set_target_address(new_target);
    self.handle_invalidate_reverse_record(&name, old_target, new_target);
}

public fun unset_reverse_lookup(self: &mut Registry, address: address) {
    let name = self.reverse_registry.remove(address);
    event::emit(ReverseLookupUnsetEvent {
        default_address: address,
        default_name: name
    });
    
}

/// Reverse lookup can only be set for the record that has the target address.
public fun set_reverse_lookup(self: &mut Registry, address: address, name: Name) {
    let record = &self.registry[name];
    let target = record.target_address();

    assert!(target.is_some(), ETargetNotSet);
    assert!(some(address) == target, ERecordMismatch);

    if (self.reverse_registry.contains(address)) {
        *self.reverse_registry.borrow_mut(address) = name;
    } else {
        event::emit(ReverseLookupSetEvent {
            default_address: address,
            default_name: name
        });
        self.reverse_registry.add(address, name);
    };
}

/// Update the `expiration_timestamp_ms` of the given `NameRegistration` and
/// `NameRecord`. Requires the `NameRegistration` to make sure that both
/// timestamps are in sync.
public fun set_expiration_timestamp_ms(
    self: &mut Registry,
    nft: &mut NameRegistration,
    name: Name,
    expiration_timestamp_ms: u64,
) {
    let record = &mut self.registry[name];

    assert!(object::id(nft) == record.nft_id(), EIdMismatch);
    record.set_expiration_timestamp_ms(expiration_timestamp_ms);
    nft.set_expiration_timestamp_ms(expiration_timestamp_ms);
}

/// Update the `data` of the given `NameRecord` using a `NameRegistration`.
/// Use with caution and validate(!!) that any system fields are not removed
/// (accidently),
/// when building authorized packages that can write the metadata field.
public fun set_data(self: &mut Registry, name: Name, data: VecMap<String, String>) {
    let record = &mut self.registry[name];
    record.set_data(data);
}

// === Reads ===

/// Checks whether the given `name` is registered in the `Registry`.
public fun has_record(self: &Registry, name: Name): bool {
    self.registry.contains(name)
}

/// Returns the `NameRecord` associated with the given name or None.
public fun lookup(self: &Registry, name: Name): Option<NameRecord> {
    if (self.registry.contains(name)) {
        let record = &self.registry[name];
        some(*record)
    } else {
        none()
    }
}

/// Returns the `name` associated with the given address or None.
public fun reverse_lookup(self: &Registry, address: address): Option<Name> {
    if (self.reverse_registry.contains(address)) {
        some(self.reverse_registry[address])
    } else {
        none()
    }
}

/// Asserts that the provided NFT:
/// 1. Matches the ID in the corresponding `Record`
/// 2. Has not expired (does not take into account the grace period)
public fun assert_nft_is_authorized(self: &Registry, nft: &NameRegistration, clock: &Clock) {
    let name = nft.name();
    let record = &self.registry[name];

    // The NFT does not
    assert!(object::id(nft) == record.nft_id(), EIdMismatch);
    assert!(!record.has_expired(clock), ERecordExpired);
    assert!(!nft.has_expired(clock), ENftExpired);
}

/// Returns the `data` associated with the given `Name`.
public fun get_data(self: &Registry, name: Name): &VecMap<String, String> {
    let record = &self.registry[name];
    record.data()
}

// === Private Functions ===

/// Checks whether a subname record is a `leaf`.
/// `leaf` record: a record whose target address can only be set by the parent,
/// hence the nft_id points to the parent's ID. Leaf records can't create
/// subnames and don't have their own `NameRegistration` object cap. The
/// `NameRegistration` of the parent is the one that manages them.
fun is_leaf_record(self: &Registry, name: Name): bool {
    if (!name.is_subname()) {
        return false
    };

    let option_name_record = self.lookup(name);

    if (option_name_record.is_none()) {
        return false
    };

    option_name_record.borrow().is_leaf_record()
}

/// An internal helper to add a record.
fun internal_add_record(
    self: &mut Registry,
    name: Name,
    no_years: u8,
    clock: &Clock,
    with_grace_period: bool,
    ctx: &mut TxContext,
): NameRegistration {
    self.remove_existing_record_if_exists_and_expired(
        name,
        clock,
        with_grace_period,
    );

    // If we've made it to this point then we know that we are able to
    // register an entry for this name.
    let nft = nft::new(name, no_years, clock, ctx);
    let name_record = name_record::new(
        object::id(&nft),
        nft.expiration_timestamp_ms(),
    );
    
    event::emit(NameRecordAddedEvent {
        name,
        name_record
    });

    self.registry.add(name, name_record);
    nft
}

fun remove_existing_record_if_exists_and_expired(
    self: &mut Registry,
    name: Name,
    clock: &Clock,
    with_grace_period: bool,
) {
    // if the name is not part of the registry, we can override.
    if (!self.registry.contains(name)) return;

    // Remove the record and assert that it has expired (past the grace period
    // if applicable)
    event::emit(NameRecordRemovedEvent {
        name,
    });
    let record = self.registry.remove(name);

    // Special case for leaf records, we can override them iff their parent has
    // changed or has expired.
    if (record.is_leaf_record()) {
        // Find the parent of the leaf record.
        let option_parent_name_record = self.lookup(name.parent().extract());

        // If there's a parent (if not, we can just remove it), we need to check
        // if the parent is valid.
        // -> If the parent is valid, we need to check if the parent is expired.
        // -> If the parent is not valid (nft_id has changed), or if the parent
        // doesn't exist anymore (owner burned it), we can override the leaf
        // record.
        if (option_parent_name_record.is_some()) {
            let parent_name_record = option_parent_name_record.borrow();

            // If the parent is the same and hasn't expired, we can't override
            // the leaf record like this.
            // We need to first remove + then call create (to protect accidental
            // overrides).
            if (parent_name_record.nft_id() == record.nft_id()) {
                assert!(parent_name_record.has_expired(clock), ERecordNotExpired);
            };
        }
    } else if (with_grace_period) {
        assert!(record.has_expired_past_grace_period(clock), ERecordNotExpired);
    } else {
        assert!(record.has_expired(clock), ERecordNotExpired);
    };

    let old_target_address = record.target_address();
    self.handle_invalidate_reverse_record(&name, old_target_address, none());
}

fun handle_invalidate_reverse_record(
    self: &mut Registry,
    name: &Name,
    old_target_address: Option<address>,
    new_target_address: Option<address>,
) {
    if (old_target_address == new_target_address) {
        return
    };

    if (old_target_address.is_none()) {
        return
    };

    let old_target_address = old_target_address.destroy_some();
    let reverse_registry = &self.reverse_registry;

    if (reverse_registry.contains(old_target_address)) {
        let default_name = &reverse_registry[old_target_address];
        if (default_name == name) {
            self.unset_reverse_lookup(old_target_address)
        }
    };
}

// === Test Functions ===

#[test_only]
use iota_names::iota_names::{add_registry, IotaNames};

#[test_only]
public fun init_for_testing(cap: &AdminCap, iota_names: &mut IotaNames, ctx: &mut TxContext) {
    add_registry(cap, iota_names, new(cap, ctx));
}

/// Create a new `Registry` for testing Purposes.
#[test_only]
public fun new_for_testing(ctx: &mut TxContext): Registry {
    Registry {
        registry: table::new(ctx),
        reverse_registry: table::new(ctx),
    }
}

#[test_only]
public fun remove_record_for_testing(self: &mut Registry, name: Name): NameRecord {
    self.registry.remove(name)
}

#[test_only]
public fun destroy_empty_for_testing(self: Registry) {
    let Registry {
        registry,
        reverse_registry,
    } = self;

    registry.destroy_empty();
    reverse_registry.destroy_empty();
}

#[test_only]
public fun destroy_for_testing(self: Registry) {
    let Registry {
        registry,
        reverse_registry,
    } = self;

    registry.drop();
    reverse_registry.drop();
}
