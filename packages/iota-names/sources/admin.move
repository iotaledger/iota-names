// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// Admin features of the IotaNames application. Meant to be called directly
/// by the iota_names admin.
module iota_names::admin;

use iota::clock::Clock;
use iota::tx_context::sender;
use iota_names::core_config::CoreConfig;
use iota_names::domain;
use iota_names::iota_names::{Self, AdminCap, IotaNames};
use iota_names::iota_names_registration::IotaNamesRegistration;
use iota_names::registry::Registry;
use std::string::String;

/// Authorization witness to call protected functions of `iota_names`.
public struct AdminAuth has drop {}

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
    iota_names.get_config<CoreConfig>().assert_is_valid_for_sale(&domain);
    let registry = iota_names::auth_registry_mut<AdminAuth, Registry>(AdminAuth {}, iota_names);
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
    let config = *iota_names.get_config<CoreConfig>();
    let registry = iota_names::auth_registry_mut<AdminAuth, Registry>(AdminAuth {}, iota_names);
    while (!domains.is_empty()) {
        let domain = domain::new(domains.pop_back());
        config.assert_is_valid_for_sale(&domain);
        let nft = registry.add_record(domain, no_years, clock, ctx);
        iota::transfer::public_transfer(nft, sender);
    };
}

/// Admin function to forcefully remove registry entries by their domain.
/// This bypasses all expiration and authorization checks and immediately 
/// removes the records and invalidates any reverse lookup entries.
public fun admin_remove_records(
    _: &AdminCap,
    iota_names: &mut IotaNames,
    mut domains: vector<String>,
) {
    let registry = iota_names::auth_registry_mut<AdminAuth, Registry>(AdminAuth {}, iota_names);
    while (!domains.is_empty()) {
        let domain = domain::new(domains.pop_back());
        registry.admin_force_remove_record(domain);
    };
}
