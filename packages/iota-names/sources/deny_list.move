// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

module iota_names::deny_list;

use iota::table::{Self, Table};
use iota_names::iota_names::{Self, AdminCap, IotaNames};
use iota_names::name::Name;
use std::string::String;

#[error]
const ENoLabelsInList: vector<u8> = b"No labels in the passed list.";

/// A wrapper that holds the reserved and blocked labels.
public struct DenyList has store {
    // The list of reserved labels.
    reserved: Table<String, bool>,
    // The list of blocked labels.
    blocked: Table<String, bool>,
}

/// Authorization witness to call protected functions of `iota_names`.
public struct DenyListAuth has drop {}

/// Sets up the deny list as admin.
public fun setup(iota_names: &mut IotaNames, cap: &AdminCap, ctx: &mut TxContext) {
    iota_names::add_registry(
        cap,
        iota_names,
        DenyList {
            reserved: table::new(ctx),
            blocked: table::new(ctx),
        },
    );
}

/// Checks for a reserved name.
public fun is_reserved_name(iota_names: &IotaNames, name: &Name): bool {
    let len = name.number_of_levels();
    let mut index = 1;

    while (index < len) {
        let label = name.label(index);
        if (deny_list(iota_names).reserved.contains(*label)) {
            return true
        };
        index = index + 1;
    };
    false
}

/// Checks for a blocked name.
public fun is_blocked_name(iota_names: &IotaNames, name: &Name): bool {
    let len = name.number_of_levels();
    let mut index = 1;

    while (index < len) {
        let label = name.label(index);
        if (deny_list(iota_names).blocked.contains(*label)) {
            return true
        };
        index = index + 1;
    };
    false
}

/// Adds a list of reserved labels to the list as admin.
public fun add_reserved_labels(iota_names: &mut IotaNames, _: &AdminCap, labels: vector<String>) {
    internal_add_labels_to_list(
        &mut deny_list_mut(iota_names).reserved,
        labels,
    );
}

/// Adds a list of blocked labels to the list as admin.
public fun add_blocked_labels(iota_names: &mut IotaNames, _: &AdminCap, labels: vector<String>) {
    internal_add_labels_to_list(
        &mut deny_list_mut(iota_names).blocked,
        labels,
    );
}

/// Removes a list of labels from the reserved list as admin.
public fun remove_reserved_labels(iota_names: &mut IotaNames, _: &AdminCap, labels: vector<String>) {
    internal_remove_labels_from_list(
        &mut deny_list_mut(iota_names).reserved,
        labels,
    );
}

/// Removes a list of labels from the blocked list as admin.
public fun remove_blocked_names(iota_names: &mut IotaNames, _: &AdminCap, labels: vector<String>) {
    internal_remove_labels_from_list(
        &mut deny_list_mut(iota_names).blocked,
        labels,
    );
}

/// Gets immutable access to the registry.
fun deny_list(iota_names: &IotaNames): &DenyList {
    iota_names.registry()
}

/// Internal helper to get access to the DenyList object
fun deny_list_mut(iota_names: &mut IotaNames): &mut DenyList {
    iota_names::auth_registry_mut<DenyListAuth, DenyList>(DenyListAuth {}, iota_names)
}

/// Internal helper to batch add labels to a table.
fun internal_add_labels_to_list(table: &mut Table<String, bool>, labels: vector<String>) {
    assert!(labels.length() > 0, ENoLabelsInList);

    let mut i = labels.length();

    while (i > 0) {
        i = i - 1;
        let label = labels[i];
        table.add(label, true);
    };
}

/// Internal helper to remove labels from a table.
fun internal_remove_labels_from_list(table: &mut Table<String, bool>, labels: vector<String>) {
    assert!(labels.length() > 0, ENoLabelsInList);

    let mut i = labels.length();

    while (i > 0) {
        i = i - 1;
        let label = labels[i];
        table.remove(label);
    };
}

#[test_only]
public fun new_for_testing(ctx: &mut TxContext): DenyList {
    DenyList {
        reserved: table::new(ctx),
        blocked: table::new(ctx),
    }
}
