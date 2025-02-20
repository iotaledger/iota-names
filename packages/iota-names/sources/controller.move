// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

module iota_names::controller;

use std::string::String;
use iota::clock::Clock;
use iota::tx_context::sender;
use iota_names::domain;
use iota_names::registry::Registry;
use iota_names::iota_names::{Self, IotaNames};
use iota_names::iota_names_registration::IotaNamesRegistration;

const AVATAR: vector<u8> = b"avatar";
const CONTENT_HASH: vector<u8> = b"content_hash";

const EUnsupportedKey: u64 = 0;

/// Authorization token for the controller.
public struct Controller has drop {}

// === Update Records Functionality ===

/// User-facing function (upgradable) - set the target address of a domain.
entry fun set_target_address(
    iota_names: &mut IotaNames,
    nft: &IotaNamesRegistration,
    new_target: Option<address>,
    clock: &Clock,
) {
    let registry = iota_names::app_registry_mut<Controller, Registry>(
        Controller {},
        iota_names,
    );
    registry.assert_nft_is_authorized(nft, clock);

    let domain = nft.domain();
    registry.set_target_address(domain, new_target);
}

/// User-facing function (upgradable) - set the reverse lookup address for the
/// domain.
entry fun set_reverse_lookup(
    iota_names: &mut IotaNames,
    domain_name: String,
    ctx: &TxContext,
) {
    let domain = domain::new(domain_name);
    let registry = iota_names::app_registry_mut<Controller, Registry>(
        Controller {},
        iota_names,
    );
    registry.set_reverse_lookup(sender(ctx), domain);
}

/// User-facing function (upgradable) - unset the reverse lookup address for the
/// domain.
entry fun unset_reverse_lookup(iota_names: &mut IotaNames, ctx: &TxContext) {
    let registry = iota_names::app_registry_mut<Controller, Registry>(
        Controller {},
        iota_names,
    );
    registry.unset_reverse_lookup(sender(ctx));
}

/// User-facing function (upgradable) - add a new key-value pair to the name
/// record's data.
entry fun set_user_data(
    iota_names: &mut IotaNames,
    nft: &IotaNamesRegistration,
    key: String,
    value: String,
    clock: &Clock,
) {
    let registry = iota_names::app_registry_mut<Controller, Registry>(
        Controller {},
        iota_names,
    );
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

/// User-facing function (upgradable) - remove a key from the name record's
/// data.
entry fun unset_user_data(
    iota_names: &mut IotaNames,
    nft: &IotaNamesRegistration,
    key: String,
    clock: &Clock,
) {
    let registry = iota_names::app_registry_mut<Controller, Registry>(
        Controller {},
        iota_names,
    );
    let mut data = *registry.get_data(nft.domain());
    let domain = nft.domain();

    registry.assert_nft_is_authorized(nft, clock);

    if (data.contains(&key)) {
        data.remove(&key);
    };

    registry.set_data(domain, data);
}

// === Testing ===

#[test_only]
public fun set_target_address_for_testing(
    iota_names: &mut IotaNames,
    nft: &IotaNamesRegistration,
    new_target: Option<address>,
    clock: &Clock,
) {
    set_target_address(iota_names, nft, new_target, clock)
}

#[test_only]
public fun set_reverse_lookup_for_testing(
    iota_names: &mut IotaNames,
    domain_name: String,
    ctx: &TxContext,
) {
    set_reverse_lookup(iota_names, domain_name, ctx)
}

#[test_only]
public fun unset_reverse_lookup_for_testing(
    iota_names: &mut IotaNames,
    ctx: &TxContext,
) {
    unset_reverse_lookup(iota_names, ctx)
}

#[test_only]
public fun set_user_data_for_testing(
    iota_names: &mut IotaNames,
    nft: &IotaNamesRegistration,
    key: String,
    value: String,
    clock: &Clock,
) {
    set_user_data(iota_names, nft, key, value, clock);
}

#[test_only]
public fun unset_user_data_for_testing(
    iota_names: &mut IotaNames,
    nft: &IotaNamesRegistration,
    key: String,
    clock: &Clock,
) {
    unset_user_data(iota_names, nft, key, clock);
}
