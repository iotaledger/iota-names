// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

module iota_names::controller;

use iota::event;
use iota::clock::Clock;
use iota::tx_context::sender;
use iota_names::name;
use iota_names::core_config::CoreConfig;
use iota_names::iota_names::{Self, IotaNames};
use iota_names::name_registration::NameRegistration;
use iota_names::registry::Registry;
use iota_names::subname_registration::SubnameRegistration;
use std::string::String;

use fun registry_mut as IotaNames.registry_mut;

#[error]
const EUnsupportedKey: vector<u8> = b"Unsupported key.";

/// Authorization witness to call protected functions of `iota_names`.
public struct ControllerAuth has drop {}

public struct UserDataSetEvent has copy, drop {
    key: String,
    value: String,
    new: bool
}

public struct UserDataUnsetEvent has copy, drop {
    key: String,
}

/// Set the target address of a name.
public fun set_target_address(
    iota_names: &mut IotaNames,
    nft: &NameRegistration,
    new_target: Option<address>,
    clock: &Clock,
) {
    let registry = iota_names.registry_mut();
    registry.assert_nft_is_authorized(nft, clock);

    let name = nft.name();
    registry.set_target_address(name, new_target);
}

/// Set the reverse lookup address for the name
public fun set_reverse_lookup(
    iota_names: &mut IotaNames,
    name: String,
    ctx: &mut TxContext,
) {
    iota_names.registry_mut().set_reverse_lookup(ctx.sender(), name::new(name));
}

/// User-facing function - unset the reverse lookup address for the name.
public fun unset_reverse_lookup(iota_names: &mut IotaNames, ctx: &mut TxContext) {
    iota_names.registry_mut().unset_reverse_lookup(ctx.sender());
}

/// Allows setting the reverse lookup address for an object.
/// Expects a mutable reference of the object.
public fun set_object_reverse_lookup(
    iota_names: &mut IotaNames,
    obj: &mut UID,
    name: String,
) {
    iota_names.registry_mut().set_reverse_lookup(obj.to_address(), name::new(name));
}

/// Allows unsetting the reverse lookup address for an object.
/// Expects a mutable reference of the object.
public fun unset_object_reverse_lookup(iota_names: &mut IotaNames, obj: &mut UID) {
    iota_names.registry_mut().unset_reverse_lookup(obj.to_address());
}

/// User-facing function - add a new key-value pair to the name record's data.
public fun set_user_data(
    iota_names: &mut IotaNames,
    nft: &NameRegistration,
    key: String,
    value: String,
    clock: &Clock,
) {
    let config = iota_names.get_config<CoreConfig>();
    assert!(config.is_valid_user_data_key(&key), EUnsupportedKey);
    
    let registry = iota_names.registry_mut();
    let mut data = *registry.get_data(nft.name());
    let name = nft.name();

    registry.assert_nft_is_authorized(nft, clock);

    let exists = data.contains(&key);

    if (exists) {
        data.remove(&key);
    };

    event::emit(UserDataSetEvent {
        key,
        value,
        new: !exists
    });

    data.insert(key, value);
    registry.set_data(name, data);
}

/// User-facing function - remove a key from the name record's data.
public fun unset_user_data(
    iota_names: &mut IotaNames,
    nft: &NameRegistration,
    key: String,
    clock: &Clock,
) {
    let registry = iota_names.registry_mut();
    let mut data = *registry.get_data(nft.name());
    let name = nft.name();

    registry.assert_nft_is_authorized(nft, clock);

    if (data.contains(&key)) {
        event::emit(UserDataUnsetEvent {
            key,
        });
        data.remove(&key);
    };

    registry.set_data(name, data);
}

public fun burn_expired(iota_names: &mut IotaNames, nft: NameRegistration, clock: &Clock) {
    iota_names.registry_mut().burn_registration_object(nft, clock);
}

public fun burn_expired_subname(
    iota_names: &mut IotaNames,
    nft: SubnameRegistration,
    clock: &Clock,
) {
    iota_names.registry_mut().burn_subname_object(nft, clock);
}

/// Get a mutable reference to the registry, if the app is authorized.
fun registry_mut(iota_names: &mut IotaNames): &mut Registry {
    iota_names::auth_registry_mut<_, Registry>(ControllerAuth {}, iota_names)
}
