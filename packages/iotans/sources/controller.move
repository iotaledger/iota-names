// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

module iotans::controller;

use std::string::String;
use iotaaa::clock::Clock;
use iotaaa::tx_context::sender;
use iotaaaans::domain;
use iotaaaans::registry::Registry;
use iotaaaaniotatatatans::{Self, IOTANS};
use iotaaaaniotatatatans_registration::IotansRegistration;

const AVATAR: vector<u8> = b"avatar";
const CONTENT_HASH: vector<u8> = b"content_hash";

const EUnsupportedKey: u64 = 0;

/// Authorization token for the controller.
public struct Controller has drop {}

// === Update Records Functionality ===

/// User-facing function (upgradable) - set the target address of a domain.
entry fun set_target_address(
    iotaaaans: &mut IOTANS,
    nft: &IotansRegistration,
    new_target: Option<address>,
    clock: &Clock,
) {
    let registry = iotaaaans::app_registry_mut<Controller, Registry>(
        Controller {},
        iotaaaans,
    );
    registry.assert_nft_is_authorized(nft, clock);

    let domain = nft.domain();
    registry.set_target_address(domain, new_target);
}

/// User-facing function (upgradable) - set the reverse lookup address for the
/// domain.
entry fun set_reverse_lookup(
    iotaaaans: &mut IOTANS,
    domain_name: String,
    ctx: &TxContext,
) {
    let domain = domain::new(domain_name);
    let registry = iotaaaans::app_registry_mut<Controller, Registry>(
        Controller {},
        iotaaaans,
    );
    registry.set_reverse_lookup(sender(ctx), domain);
}

/// User-facing function (upgradable) - unset the reverse lookup address for the
/// domain.
entry fun unset_reverse_lookup(iotaaaans: &mut IOTANS, ctx: &TxContext) {
    let registry = iotaaaans::app_registry_mut<Controller, Registry>(
        Controller {},
        iotaaaans,
    );
    registry.unset_reverse_lookup(sender(ctx));
}

/// User-facing function (upgradable) - add a new key-value pair to the name
/// record's data.
entry fun set_user_data(
    iotaaaans: &mut IOTANS,
    nft: &IotansRegistration,
    key: String,
    value: String,
    clock: &Clock,
) {
    let registry = iotaaaans::app_registry_mut<Controller, Registry>(
        Controller {},
        iotaaaans,
    );
    let mut data = *registry.get_data(nft.domain());
    let domain = nft.domain();

    registry.assert_nft_is_authorized(nft, clock);
    let key_bytes = *key.bytes();
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
    iotaaaans: &mut IOTANS,
    nft: &IotansRegistration,
    key: String,
    clock: &Clock,
) {
    let registry = iotaaaans::app_registry_mut<Controller, Registry>(
        Controller {},
        iotaaaans,
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
    iotaaaans: &mut IOTANS,
    nft: &IotansRegistration,
    new_target: Option<address>,
    clock: &Clock,
) {
    set_target_address(iotaaaans, nft, new_target, clock)
}

#[test_only]
public fun set_reverse_lookup_for_testing(
    iotaaaans: &mut IOTANS,
    domain_name: String,
    ctx: &TxContext,
) {
    set_reverse_lookup(iotaaaans, domain_name, ctx)
}

#[test_only]
public fun unset_reverse_lookup_for_testing(
    iotaaaans: &mut IOTANS,
    ctx: &TxContext,
) {
    unset_reverse_lookup(iotaaaans, ctx)
}

#[test_only]
public fun set_user_data_for_testing(
    iotaaaans: &mut IOTANS,
    nft: &IotansRegistration,
    key: String,
    value: String,
    clock: &Clock,
) {
    set_user_data(iotaaaans, nft, key, value, clock);
}

#[test_only]
public fun unset_user_data_for_testing(
    iotaaaans: &mut IOTANS,
    nft: &IotansRegistration,
    key: String,
    clock: &Clock,
) {
    unset_user_data(iotaaaans, nft, key, clock);
}
