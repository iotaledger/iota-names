// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

module iota_names::validation;

use iota_names::core_config::CoreConfig;
use iota_names::deny_list;
use iota_names::name::Name;
use iota_names::iota_names::IotaNames;

#[error]
const EBlockedName: vector<u8> = b"Name is blocked.";
#[error]
const EReservedName: vector<u8> = b"Name is reserved.";

/// Validates that a name contains no blocked or reserved segments.
public fun assert_not_blocked_or_reserved(iota_names: &IotaNames, name: &Name) {
    assert!(!deny_list::is_blocked_name(iota_names, name), EBlockedName);
    assert!(!deny_list::is_reserved_name(iota_names, name), EReservedName);
}

/// Validates that a name is valid for sale according to core config and deny list rules.
public fun assert_is_valid_for_sale(config: &CoreConfig, iota_names: &IotaNames, name: &Name) {
    // Checks for length, TLN and subname restrictions.
    config.assert_is_valid_for_sale(name);

    // Checks whether the name contains any blocked or reserved labels.
    assert_not_blocked_or_reserved(iota_names, name);
}
