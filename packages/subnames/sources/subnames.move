// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// A registration module for subnames.
///
/// This module is responsible for creating subnames and managing their settings.
///
/// It allows the following functionality:
///
/// 1. Registering a new subname as a holder of Parent NFT.
/// 2. Setup the subname with capabilities (creating nested names, extending to parent's renewal time).
/// 3. Registering `leaf` names (whose parent acts as the Capability holder)
/// 4. Removing `leaf` names
/// 5. Extending a subname expiration's time
/// 6. Burning expired subname NFTs.
///
/// Comments:
///
/// 1. By attaching the creation/extension attributes as metadata to the subname's NameRecord, we can easily
/// turn off this package completely, and retain the state on a different package's deployment. This is useful
/// both for effort-less upgradeability and gas savings.
/// 2. For any `registry_mut` call, we know that if this module is not authorized, we'll get an abort
/// from the core IotaNames package.
///
module iota_names_subnames::subnames;

use iota::clock::Clock;
use iota::dynamic_field as df;
use iota::event;
use iota::vec_map::VecMap;
use iota_names::constants::{subname_allow_extension_key, subname_allow_creation_key};
use iota_names::name::{Self, Name, is_subname};
use iota_names::iota_names::{Self, IotaNames};
use iota_names::name_registration::NameRegistration;
use iota_names::registry::Registry;
use iota_names::subname_registration::SubnameRegistration;
use iota_names::validation;
use std::string::{String, utf8};
use iota_names_subnames::config::{Self, SubnameConfig};

#[error]
const EInvalidExpirationDate: vector<u8> =
    b"Tried to create a subname that expires later than the parent or below the minimum.";
#[error]
const ECreationDisabledForSubname: vector<u8> =
    b"Tried to create a subname with a parent that is not allowed to do so.";
#[error]
const EExtensionDisabledForSubname: vector<u8> =
    b"Tried to extend the expiration of a subname which doesn't have the permission to do so.";
#[error]
const ESubnameReplaced: vector<u8> =
    b"The subname has been replaced by a newer NFT, so it can't be renewed.";
#[error]
const EParentChanged: vector<u8> =
    b"Parent for a given subname has changed, hence time extension cannot be done.";

/// Enabled metadata value.
const ACTIVE_METADATA_VALUE: vector<u8> = b"1";

/// Authorization witness to call protected functions of `iota_names`.
public struct SubnamesAuth has drop {}

/// The key to store the parent's ID in the subname object.
public struct ParentKey has copy, drop, store {}

/// Creates a `leaf` subname
/// A `leaf` subname, is a subname that is managed by the parent's NFT.
public fun new_leaf(
    iota_names: &mut IotaNames,
    parent: &NameRegistration,
    clock: &Clock,
    subname: String,
    target: address,
    ctx: &mut TxContext,
) {
    let subname = name::new(subname);
    validation::assert_not_blocked_or_reserved(iota_names, &subname);
    
    // all validation logic for subname creation / management.
    internal_validate_nft_can_manage_subname(iota_names, parent, clock, subname, true);

    // Aborts with `iota_names::registry::ERecordExists` if the subname already exists.
    registry_mut(iota_names).add_leaf_record(subname, clock, target, ctx);

    event::emit(LeafSubnameCreatedEvent{
        name: subname,
        target,
    });
}

/// Removes a `leaf` subname from the registry.
/// Management of the `leaf` subname can only be achieved through the parent's valid NFT.
public fun remove_leaf(
    iota_names: &mut IotaNames,
    parent: &NameRegistration,
    clock: &Clock,
    subname: String,
) {
    let subname = name::new(subname);

    // All validation logic for subname creation / management.
    // We pass `false` as last argument because even if we don't have create capabilities (anymore),
    // we can still remove a leaf name (we just can't add a new one).
    internal_validate_nft_can_manage_subname(iota_names, parent, clock, subname, false);

    registry_mut(iota_names).remove_leaf_record(subname);

    event::emit(LeafSubnameRemovedEvent{
        name: subname,
    });
}

/// Creates a new `node` subname
///
/// The following script does the following lookups:
/// 1. Checks if app is authorized.
/// 2. Validates that the parent NFT is valid and non expired.
/// 3. Validates that the parent can create subnames (based on the on-chain setup). [all 2nd level names with valid tln can create names]
/// 4. Validates the subname validity.
///     2.1 Checks that the TLN is in the list of supported tlns.
///     2.2 Checks that the length of the new label has the min length.
///     2.3 Validates that this subname can indeed be registered by that parent.
///     2.4 Validates that the subname's expiration timestamp is less or equal to the parents.
///     2.5 Checks if this subname already exists. [If it does, it aborts if it's not expired, overrides otherwise]
///
/// It then saves the configuration for that child (manage-able by the parent), and returns the NameRegistration object.
public fun new(
    iota_names: &mut IotaNames,
    parent: &NameRegistration,
    clock: &Clock,
    subname: String,
    expiration_timestamp_ms: u64,
    allow_creation: bool,
    allow_time_extension: bool,
    ctx: &mut TxContext,
): SubnameRegistration {
    let subname = name::new(subname);
    validation::assert_not_blocked_or_reserved(iota_names, &subname);
    
    // all validation logic for subname creation / management.
    internal_validate_nft_can_manage_subname(iota_names, parent, clock, subname, true);

    // Validate that the duration is at least the minimum duration.
    assert!(
        expiration_timestamp_ms >= clock.timestamp_ms() + app_config(iota_names).minimum_duration(),
        EInvalidExpirationDate,
    );
    // validate that the requested expiration timestamp is not greater than the parent's one.
    assert!(expiration_timestamp_ms <= parent.expiration_timestamp_ms(), EInvalidExpirationDate);

    // We register the subname (e.g. `subname.example.iota`) and return the NameRegistration object.
    // Aborts with `iota_names::registry::ERecordExists` if the subname already exists.
    let nft = internal_create_subname(
        registry_mut(iota_names),
        subname,
        expiration_timestamp_ms,
        object::id(parent),
        clock,
        ctx,
    );

    // We create the `setup` for the particular SubnameRegistration.
    // We save a setting like: `subname.example.iota` -> { allow_creation: true/false, allow_time_extension: true/false }
    if (allow_creation) {
        internal_set_flag(
            iota_names,
            subname,
            subname_allow_creation_key(),
            allow_creation,
        );
    };

    if (allow_time_extension) {
        internal_set_flag(
            iota_names,
            subname,
            subname_allow_extension_key(),
            allow_time_extension,
        );
    };

    event::emit(NodeSubnameCreatedEvent{
        name: subname,
        expiration_timestamp_ms,
        allow_creation,
        allow_time_extension,
    });

    nft
}

/// Extends the expiration of a `node` subname.
public fun extend_expiration(
    iota_names: &mut IotaNames,
    sub_nft: &mut SubnameRegistration,
    expiration_timestamp_ms: u64,
) {
    let registry = registry(iota_names);

    let nft = sub_nft.nft_mut();
    let subname = nft.name();
    let parent_name = subname.parent().extract();

    // Check if time extension is allowed for this subname.
    assert!(
        is_extension_allowed(&record_metadata(iota_names, subname)),
        EExtensionDisabledForSubname,
    );

    let existing_name_record = registry.lookup(subname);
    let parent_name_record = registry.lookup(parent_name);

    // we need to make sure this name record exists (both child + parent), otherwise we don't have a valid object.
    assert!(
        option::is_some(&existing_name_record) && option::is_some(&parent_name_record),
        ESubnameReplaced,
    );

    // Validate that the parent of the name is the same as the actual parent
    // (to prevent cases where owner of the parent changed. When that happens, subnames lose all abilities to renew / create subnames)
    assert!(parent(nft) == option::borrow(&parent_name_record).nft_id(), EParentChanged);

    // validate that expiration date is > than the current.
    assert!(expiration_timestamp_ms > nft.expiration_timestamp_ms(), EInvalidExpirationDate);
    // validate that the requested expiration timestamp is not greater than the parent's one.
    assert!(
        expiration_timestamp_ms <= option::borrow(&parent_name_record).expiration_timestamp_ms(),
        EInvalidExpirationDate,
    );

    registry_mut(iota_names).set_expiration_timestamp_ms(
        nft,
        subname,
        expiration_timestamp_ms,
    );
}

/// Called by the parent name to edit a subname's settings.
/// - Allows the parent name to toggle time extension.
/// - Allows the parent to toggle subname (grand-children) creation
/// --> For creations: A parent can't retract already created children, nor can limit the depth if creation capability is on.
public fun edit_setup(
    iota_names: &mut IotaNames,
    parent: &NameRegistration,
    clock: &Clock,
    subname: String,
    allow_creation: bool,
    allow_time_extension: bool,
) {
    // validate that parent is a valid, non expired object.
    registry(iota_names).assert_nft_is_authorized(parent, clock);

    let parent_name = parent.name();
    let subname = name::new(subname);

    // validate that the subname is valid for the supplied parent
    // (as well as it is valid in label length, total length, depth, etc).
    config::assert_is_valid_subname(&parent_name, &subname, app_config(iota_names));

    // We create the `setup` for the particular SubnameRegistration.
    // We save a setting like: `subname.example.iota` -> { allow_creation: true/false, allow_time_extension: true/false }
    internal_set_flag(iota_names, subname, subname_allow_creation_key(), allow_creation);
    internal_set_flag(
        iota_names,
        subname,
        subname_allow_extension_key(),
        allow_time_extension,
    );
}

/// Burns a `SubnameRegistration` object if it is expired.
public fun burn(iota_names: &mut IotaNames, nft: SubnameRegistration, clock: &Clock) {
    let name = nft.nft().name();
    registry_mut(iota_names).burn_subname_object(nft, clock);

    event::emit(NodeSubnameBurnedEvent{
        name,
    });
}

/// Parent ID of a subname
public fun parent(subname: &NameRegistration): ID {
    *df::borrow(subname.uid(), ParentKey {})
}

// Sets/removes a (key,value) on the name's NameRecord metadata (depending on cases).
// Validation needs to happen on the calling function.
fun internal_set_flag(self: &mut IotaNames, subname: Name, key: String, enable: bool) {
    let mut config = record_metadata(self, subname);
    let is_enabled = config.contains(&key);

    if (enable && !is_enabled) {
        config.insert(key, utf8(ACTIVE_METADATA_VALUE));
    };

    if (!enable && is_enabled) {
        config.remove(&key);
    };

    registry_mut(self).set_data(subname, config);
}

/// Check if subname creation is allowed.
fun is_creation_allowed(metadata: &VecMap<String, String>): bool {
    metadata.contains(&subname_allow_creation_key())
}

/// Check if time extension is allowed.
fun is_extension_allowed(metadata: &VecMap<String, String>): bool {
    metadata.contains(&subname_allow_extension_key())
}

/// Get the name record's metadata for a subname.
fun record_metadata(self: &IotaNames, subname: Name): VecMap<String, String> {
    *registry(self).get_data(subname)
}

/// Does all the regular checks for validating that a parent `NameRegistration` object
/// can operate on a given subname.
///
/// 1. Checks that NFT is authorized.
/// 2. Checks that the parent can create subnames (applies to subname `node` names).
/// 3. Validates that the subname is valid (accepted TLN, depth, length, is child of given parent, etc).
fun internal_validate_nft_can_manage_subname(
    iota_names: &IotaNames,
    parent: &NameRegistration,
    clock: &Clock,
    subname: Name,
    // Set to `true` for `validate_creation` if you want to validate that the parent can create subnames.
    // Set to false when editing the setup of a subname or removing leaf names.
    check_creation_auth: bool,
) {
    // validate that parent is a valid, non expired object.
    registry(iota_names).assert_nft_is_authorized(parent, clock);

    if (check_creation_auth) {
        // validate that the parent can create subnames.
        internal_assert_parent_can_create_subnames(iota_names, parent.name());
    };

    // validate that the subname is valid for the supplied parent.
    config::assert_is_valid_subname(&parent.name(), &subname, app_config(iota_names));
}

/// Validate whether a `NameRegistration` object is eligible for creating a subname.
/// 1. If the NFT is authorized (not expired, active)
/// 2. If the parent is a subname, check whether it is allowed to create subnames.
fun internal_assert_parent_can_create_subnames(self: &IotaNames, parent: Name) {
    // if the parent is not a subname, we can always create subnames.
    if (!is_subname(&parent)) {
        return
    };

    // if `parent` is a subname. We check the subname config to see if we are allowed to mint subnames.
    // For regular names (e.g. example.iota), we can always mint subnames.
    // if there's no config for this parent, and the parent is a subname, we can't create deeper names.
    assert!(is_creation_allowed(&record_metadata(self, parent)), ECreationDisabledForSubname);
}

/// An internal function to add a subname to the registry with the correct expiration timestamp.
/// It doesn't check whether the expiration is valid. This needs to be checked on the calling function.
fun internal_create_subname(
    registry: &mut Registry,
    subname: Name,
    expiration_timestamp_ms: u64,
    parent_nft_id: ID,
    clock: &Clock,
    ctx: &mut TxContext,
): SubnameRegistration {
    let mut nft = registry.add_record_ignoring_grace_period(subname, 1, clock, ctx);
    // set the timestamp to the correct one. `add_record` only works with years but we can correct it easily here.
    registry.set_expiration_timestamp_ms(&mut nft, subname, expiration_timestamp_ms);

    // attach the `ParentID` to the NameRegistration, so we validate that the parent who created this subname
    // is the same as the one currently holding the parent name.
    df::add(nft.uid_mut(), ParentKey {}, parent_nft_id);

    registry.wrap_subname(nft, clock, ctx)
}

// == Internal helper to access registry & app setup ==

fun registry(iota_names: &IotaNames): &Registry {
    iota_names.registry<Registry>()
}

fun registry_mut(iota_names: &mut IotaNames): &mut Registry {
    iota_names::auth_registry_mut<SubnamesAuth, Registry>(SubnamesAuth {}, iota_names)
}

fun app_config(iota_names: &IotaNames): &SubnameConfig {
    iota_names.get_config<SubnameConfig>()
}

#[test_only]
public fun auth_for_testing(): SubnamesAuth {
    SubnamesAuth {}
}

public struct NodeSubnameCreatedEvent has copy, drop {
    name: Name,
    expiration_timestamp_ms: u64,
    allow_creation: bool,
    allow_time_extension: bool,
}

public struct NodeSubnameBurnedEvent has copy, drop {
    name: Name,
}

public struct LeafSubnameCreatedEvent has copy, drop {
    name: Name,
    target: address,
}

public struct LeafSubnameRemovedEvent has copy, drop {
    name: Name,
}
