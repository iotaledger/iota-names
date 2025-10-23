// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// Admin features of the IotaNames application. Meant to be called directly
/// by the iota_names admin.
module iota_names::admin;

use iota::clock::Clock;
use iota_names::core_config::CoreConfig;
use iota_names::name::{Self, Name};
use iota_names::iota_names::{Self, AdminCap, IotaNames};
use iota_names::name_registration::NameRegistration;
use iota_names::registry::Registry;
use std::string::String;
use iota_names::deny_list;

#[error]
const ENoNamesProvided: vector<u8> = b"No names provided";
#[error]
const ENamesRecipientsMismatch: vector<u8> = b"Names and recipients length mismatch";

/// Authorization witness to call protected functions of `iota_names`.
public struct AdminAuth has drop {}

/// Register a `name` in `IotaNames`.
public fun register_name(
    _: &AdminCap,
    iota_names: &mut IotaNames,
    name: String,
    no_years: u8,
    clock: &Clock,
    ctx: &mut TxContext,
): NameRegistration {
    let name = name::new(name);
    deny_list::remove_reserved_labels_for_name(iota_names, &name);
    iota_names.get_config<CoreConfig>().assert_is_valid_for_sale(&name);
    let registry = iota_names::auth_registry_mut<AdminAuth, Registry>(AdminAuth {}, iota_names);
    registry.add_record(name, no_years, clock, ctx)
}

/// Register a list of names.
entry fun register_names(
    _: &AdminCap,
    iota_names: &mut IotaNames,
    names: vector<String>,
    mut recipients: vector<address>,
    no_years: u8,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(!names.is_empty(), ENoNamesProvided);
    assert!(names.length() == recipients.length(), ENamesRecipientsMismatch);
    let config = *iota_names.get_config<CoreConfig>();
    let mut name_structs = vector::empty<Name>();
    let mut tmp_names = names;
    while (!tmp_names.is_empty()) {
        let n = name::new(tmp_names.pop_back());
        name_structs.push_back(n);
    };
    recipients.reverse();
    deny_list::remove_reserved_labels_for_names(iota_names, &name_structs);
    // Add records
    let registry = iota_names::auth_registry_mut<AdminAuth, Registry>(AdminAuth {}, iota_names);
    while (!name_structs.is_empty()) {
        let name = name_structs.pop_back();
        let recipient = recipients.pop_back();
        config.assert_is_valid_for_sale(&name);
        let nft = registry.add_record(name, no_years, clock, ctx);
        iota::transfer::public_transfer(nft, recipient);
    };
}

/// Admin function to forcefully remove registry entries by their name.
/// This bypasses all expiration and authorization checks and immediately 
/// removes the records and invalidates any reverse lookup entries.
public fun admin_remove_records(
    _: &AdminCap,
    iota_names: &mut IotaNames,
    mut names: vector<String>,
) {
    let registry = iota_names::auth_registry_mut<AdminAuth, Registry>(AdminAuth {}, iota_names);
    assert!(!names.is_empty(), ENoNamesProvided);
    while (!names.is_empty()) {
        let name = name::new(names.pop_back());
        registry.force_remove_record(name);
    };
}
