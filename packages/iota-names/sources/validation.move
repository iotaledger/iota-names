// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

module iota_names::validation;

use iota_names::core_config::CoreConfig;
use iota_names::deny_list;
use iota_names::domain::Domain;
use iota_names::iota_names::IotaNames;

#[error]
const EBlockedName: vector<u8> = b"Name is blocked.";

#[error]
const EReservedName: vector<u8> = b"Name is reserved.";

/// Validates if a domain is valid for sale according to core config and deny list rules.
public fun assert_is_valid_for_sale(config: &CoreConfig, iota_names: &IotaNames, domain: &Domain) {
    // Checks for (length, TLD, subdomain restrictions)
    config.assert_is_valid_for_sale(domain);
    
    assert!(!deny_list::is_blocked_name(iota_names, domain), EBlockedName);
    assert!(!deny_list::is_reserved_name(iota_names, domain), EReservedName);
}
