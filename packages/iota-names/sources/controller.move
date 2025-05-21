// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

module iota_names::controller;

use iota::clock::Clock;
use iota::tx_context::sender;
use iota_names::domain;
use iota_names::iota_names::{Self, IotaNames};
use iota_names::iota_names_registration::IotaNamesRegistration;
use iota_names::registry::Registry;
use iota_names::subdomain_registration::SubdomainRegistration;
use std::string::String;

const AVATAR: vector<u8> = b"avatar";
const CONTENT_HASH: vector<u8> = b"content_hash";

use fun registry_mut as IotaNames.registry_mut;

/// Authorization witness to call protected functions of `iota_names`.
public struct ControllerAuth has drop {}

/// Set the target address of a domain.
public fun set_target_address(
    iota_names: &mut IotaNames,
    nft: &IotaNamesRegistration,
    new_target: Option<address>,
    clock: &Clock,
) {
    let registry = iota_names.registry_mut();
    registry.assert_nft_is_authorized(nft, clock);

    let domain = nft.domain();
    registry.set_target_address(domain, new_target);
}

/// Set the reverse lookup address for the domain
public fun set_reverse_lookup(
    iota_names: &mut IotaNames,
    domain_name: String,
    ctx: &mut TxContext,
) {
    iota_names.registry_mut().set_reverse_lookup(ctx.sender(), domain::new(domain_name));
}

/// User-facing function - unset the reverse lookup address for the domain.
public fun unset_reverse_lookup(iota_names: &mut IotaNames, ctx: &mut TxContext) {
    iota_names.registry_mut().unset_reverse_lookup(ctx.sender());
}

/// Allows setting the reverse lookup address for an object.
/// Expects a mutable reference of the object.
public fun set_object_reverse_lookup(
    iota_names: &mut IotaNames,
    obj: &mut UID,
    domain_name: String,
) {
    iota_names.registry_mut().set_reverse_lookup(obj.to_address(), domain::new(domain_name));
}

/// Allows unsetting the reverse lookup address for an object.
/// Expects a mutable reference of the object.
public fun unset_object_reverse_lookup(iota_names: &mut IotaNames, obj: &mut UID) {
    iota_names.registry_mut().unset_reverse_lookup(obj.to_address());
}

/// User-facing function - add a new key-value pair to the name record's data.
public fun set_user_data(
    iota_names: &mut IotaNames,
    nft: &IotaNamesRegistration,
    key: String,
    value: String,
    clock: &Clock,
) {
    let registry = iota_names.registry_mut();
    let mut data = *registry.get_user_data(nft.domain());
    let domain = nft.domain();

    registry.assert_nft_is_authorized(nft, clock);

    if (data.contains(&key)) {
        data.remove(&key);
    };

    data.insert(key, value);
    registry.set_user_data(domain, data);
}

/// User-facing function - remove a key from the name record's data.
public fun unset_user_data(
    iota_names: &mut IotaNames,
    nft: &IotaNamesRegistration,
    key: String,
    clock: &Clock,
) {
    let registry = iota_names.registry_mut();
    let mut data = *registry.get_user_data(nft.domain());
    let domain = nft.domain();

    registry.assert_nft_is_authorized(nft, clock);

    if (data.contains(&key)) {
        data.remove(&key);
    };

    registry.set_user_data(domain, data);
}

/// Set the avatar metadata for the record
public fun set_avatar(
    iota_names: &mut IotaNames,
    nft: &IotaNamesRegistration,
    value: String,
    clock: &Clock,
) {
    let registry = iota_names.registry_mut();
    let mut data = *registry.get_metadata(nft.domain());
    let domain = nft.domain();

    registry.assert_nft_is_authorized(nft, clock);
    let key = AVATAR.to_string();

    if (data.contains(&key)) {
        data.remove(&key);
    };

    data.insert(key, value);
    registry.set_metadata(domain, data);
}

/// Set the content hash metadata for the record
public fun set_content_hash(
    iota_names: &mut IotaNames,
    nft: &IotaNamesRegistration,
    value: String,
    clock: &Clock,
) {
    let registry = iota_names.registry_mut();
    let mut data = *registry.get_metadata(nft.domain());
    let domain = nft.domain();

    registry.assert_nft_is_authorized(nft, clock);
    let key = CONTENT_HASH.to_string();

    if (data.contains(&key)) {
        data.remove(&key);
    };

    data.insert(key, value);
    registry.set_metadata(domain, data);
}

/// Remove the currently set avatar metadata
public fun unset_avatar(
    iota_names: &mut IotaNames,
    nft: &IotaNamesRegistration,
    clock: &Clock,
) {
    let registry = iota_names.registry_mut();
    let mut data = *registry.get_metadata(nft.domain());
    let domain = nft.domain();

    registry.assert_nft_is_authorized(nft, clock);

    let key = AVATAR.to_string();

    if (data.contains(&key)) {
        data.remove(&key);
    };

    registry.set_metadata(domain, data);
}

/// Remove the currently set content hash metadata
public fun unset_content_hash(
    iota_names: &mut IotaNames,
    nft: &IotaNamesRegistration,
    clock: &Clock,
) {
    let registry = iota_names.registry_mut();
    let mut data = *registry.get_metadata(nft.domain());
    let domain = nft.domain();

    registry.assert_nft_is_authorized(nft, clock);

    let key = CONTENT_HASH.to_string();

    if (data.contains(&key)) {
        data.remove(&key);
    };

    registry.set_metadata(domain, data);
}

public fun burn_expired(iota_names: &mut IotaNames, nft: IotaNamesRegistration, clock: &Clock) {
    iota_names.registry_mut().burn_registration_object(nft, clock);
}

public fun burn_expired_subname(
    iota_names: &mut IotaNames,
    nft: SubdomainRegistration,
    clock: &Clock,
) {
    iota_names.registry_mut().burn_subdomain_object(nft, clock);
}

/// Get a mutable reference to the registry, if the app is authorized.
fun registry_mut(iota_names: &mut IotaNames): &mut Registry {
    iota_names::auth_registry_mut<_, Registry>(ControllerAuth {}, iota_names)
}
