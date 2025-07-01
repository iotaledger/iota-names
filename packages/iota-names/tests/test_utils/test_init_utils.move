// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
/// Common test initialization utilities for setting up IotaNames with all required registries
module iota_names::test_init_utils;

use iota_names::deny_list::{Self, DenyListAuth};
use iota_names::iota_names::{IotaNames, AdminCap};
use iota_names::registry;

/// Initialize IotaNames with registry and deny_list setup for testing
public fun setup_for_testing(iota_names: &mut IotaNames, cap: &AdminCap, ctx: &mut TxContext) {
    // Set up registry
    registry::init_for_testing(cap, iota_names, ctx);
    
    // Authorize deny_list
    iota_names.authorize_for_testing<DenyListAuth>();
    
    // Set up deny_list
    deny_list::setup(iota_names, cap, ctx);
}
