// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// Admin features of the IotaNS application. Meant to be called directly
/// by the iotans admin.
module iotans::admin;

use std::string::String;
use iota::clock::Clock;
use iota::tx_context::sender;
use iotans::config;
use iotans::domain;
use iotans::registry::Registry;
use iotans::iotans::{Self, AdminCap, IotaNS};
use iotans::iotans_registration::IotansRegistration;

/// The authorization witness.
public struct Admin has drop {}

/// Authorize the admin application in the IotaNS to get access
/// to protected functions. Must be called in order to use the rest
/// of the functions.
public fun authorize(cap: &AdminCap, iotans: &mut IotaNS) {
    iotans::authorize_app<Admin>(cap, iotans)
}

/// Reserve a `domain` in the `IotaNS`.
public fun reserve_domain(
    _: &AdminCap,
    iotans: &mut IotaNS,
    domain_name: String,
    no_years: u8,
    clock: &Clock,
    ctx: &mut TxContext,
): IotansRegistration {
    let domain = domain::new(domain_name);
    config::assert_valid_user_registerable_domain(&domain);
    let registry = iotans::app_registry_mut<Admin, Registry>(Admin {}, iotans);
    registry.add_record(domain, no_years, clock, ctx)
}

/// Reserve a list of domains.
entry fun reserve_domains(
    _: &AdminCap,
    iotans: &mut IotaNS,
    mut domains: vector<String>,
    no_years: u8,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let sender = sender(ctx);
    let registry = iotans::app_registry_mut<Admin, Registry>(Admin {}, iotans);
    while (!domains.is_empty()) {
        let domain = domain::new(domains.pop_back());
        config::assert_valid_user_registerable_domain(&domain);
        let nft = registry.add_record(domain, no_years, clock, ctx);
        iota::transfer::public_transfer(nft, sender);
    };
}
