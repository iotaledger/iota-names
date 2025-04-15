// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

module iota_names::controller;

use iota::{clock::Clock, tx_context::sender};
use iota_names::{
    domain,
    iota_names::{Self, IotaNames},
    iota_names_registration::IotaNamesRegistration,
    registry::Registry,
    subdomain_registration::SubDomainRegistration
};
use std::string::String;

const AVATAR: vector<u8> = b"avatar";
const CONTENT_HASH: vector<u8> = b"content_hash";

use fun registry_mut as IotaNames.registry_mut;

#[error]
const EUnsupportedKey: vector<u8> = b"Unsupported key.";

/// Authorization token for the controller which
/// is used to call protected functions.
public struct Controller() has drop;

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
    let mut data = *registry.get_data(nft.domain());
    let domain = nft.domain();

    registry.assert_nft_is_authorized(nft, clock);
    let key_bytes = *key.as_bytes();
    assert!(key_bytes == AVATAR || key_bytes == CONTENT_HASH, EUnsupportedKey);

    if (data.contains(&key)) {
        data.remove(&key);
    };

    data.insert(key, value);
    registry.set_data(domain, data);
}

/// User-facing function - remove a key from the name record's data.
public fun unset_user_data(
    iota_names: &mut IotaNames,
    nft: &IotaNamesRegistration,
    key: String,
    clock: &Clock,
) {
    let registry = iota_names.registry_mut();
    let mut data = *registry.get_data(nft.domain());
    let domain = nft.domain();

    registry.assert_nft_is_authorized(nft, clock);

    if (data.contains(&key)) {
        data.remove(&key);
    };

    registry.set_data(domain, data);
}

public fun burn_expired(iota_names: &mut IotaNames, nft: IotaNamesRegistration, clock: &Clock) {
    iota_names.registry_mut().burn_registration_object(nft, clock);
}

public fun burn_expired_subname(
    iota_names: &mut IotaNames,
    nft: SubDomainRegistration,
    clock: &Clock,
) {
    iota_names.registry_mut().burn_subdomain_object(nft, clock);
}

/// Get a mutable reference to the registry, if the app is authorized.
fun registry_mut(iota_names: &mut IotaNames): &mut Registry {
    iota_names::app_registry_mut<_, Registry>(Controller(), iota_names)
}
