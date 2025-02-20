// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// Admin features of the IotaNames application. Meant to be called directly
/// by the iota_names admin.
module iota_names::admin;

use std::string::String;
use iota::clock::Clock;
use iota::tx_context::sender;
use iota_names::config;
use iota_names::domain;
use iota_names::registry::Registry;
use iota_names::iota_names::{Self, AdminCap, IotaNames};
use iota_names::iota_names_registration::IotaNamesRegistration;

/// The authorization witness.
public struct Admin has drop {}

/// Reserve a `domain` in the `IotaNames`.
public fun reserve_domain(
    _: &AdminCap,
    iota_names: &mut IotaNames,
    domain_name: String,
    no_years: u8,
    clock: &Clock,
    ctx: &mut TxContext,
): IotaNamesRegistration {
    let domain = domain::new(domain_name);
    config::assert_valid_user_registerable_domain(&domain);
    let registry = iota_names::app_registry_mut<Admin, Registry>(Admin {}, iota_names);
    registry.add_record(domain, no_years, clock, ctx)
}

/// Reserve a list of domains.
entry fun reserve_domains(
    _: &AdminCap,
    iota_names: &mut IotaNames,
    mut domains: vector<String>,
    no_years: u8,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let sender = sender(ctx);
    let registry = iota_names::app_registry_mut<Admin, Registry>(Admin {}, iota_names);
    while (!domains.is_empty()) {
        let domain = domain::new(domains.pop_back());
        config::assert_valid_user_registerable_domain(&domain);
        let nft = registry.add_record(domain, no_years, clock, ctx);
        iota::transfer::public_transfer(nft, sender);
    };
}
