// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// A `temporary` proxy used to proxy subname requests
/// because we can't use references in a PTB.
///
/// Module has no tests as it's a plain proxy for other function calls.
/// All validation happens on those functions.
///
/// This package will stop being used when we've implemented references in PTBs.
module iota_names_temp_subname_proxy::subname_proxy;

use iota::clock::Clock;
use iota_names::controller;
use iota_names::iota_names::IotaNames;
use iota_names::subname_registration::SubnameRegistration;
use std::string::String;
use iota_names_subnames::subnames;

/// Struct to authenticate this module in the IOTA-Names object, so it can be fetched dynamically by the CLI.
/// It's not required for the functionality of this module.
public struct SubnameProxyAuth has drop {}

public fun new(
    iota_names: &mut IotaNames,
    subname: &SubnameRegistration,
    clock: &Clock,
    subname_str: String,
    expiration_timestamp_ms: u64,
    allow_creation: bool,
    allow_time_extension: bool,
    ctx: &mut TxContext,
): SubnameRegistration {
    subnames::new(
        iota_names,
        subname.nft(),
        clock,
        subname_str,
        expiration_timestamp_ms,
        allow_creation,
        allow_time_extension,
        ctx,
    )
}

public fun new_leaf(
    iota_names: &mut IotaNames,
    subname: &SubnameRegistration,
    clock: &Clock,
    subname_str: String,
    target: address,
    ctx: &mut TxContext,
) {
    subnames::new_leaf(
        iota_names,
        subname.nft(),
        clock,
        subname_str,
        target,
        ctx,
    );
}

public fun remove_leaf(
    iota_names: &mut IotaNames,
    subname: &SubnameRegistration,
    clock: &Clock,
    subname_str: String,
) {
    subnames::remove_leaf(
        iota_names,
        subname.nft(),
        clock,
        subname_str,
    );
}

public fun edit_setup(
    iota_names: &mut IotaNames,
    parent: &SubnameRegistration,
    clock: &Clock,
    subname: String,
    allow_creation: bool,
    allow_time_extension: bool,
) {
    subnames::edit_setup(
        iota_names,
        parent.nft(),
        clock,
        subname,
        allow_creation,
        allow_time_extension,
    );
}

public fun set_target_address(
    iota_names: &mut IotaNames,
    subname: &SubnameRegistration,
    new_target: Option<address>,
    clock: &Clock,
) {
    controller::set_target_address(
        iota_names,
        subname.nft(),
        new_target,
        clock,
    );
}

public fun set_user_data(
    iota_names: &mut IotaNames,
    subname: &SubnameRegistration,
    key: String,
    value: String,
    clock: &Clock,
) {
    controller::set_user_data(
        iota_names,
        subname.nft(),
        key,
        value,
        clock,
    );
}

public fun unset_user_data(
    iota_names: &mut IotaNames,
    subname: &SubnameRegistration,
    key: String,
    clock: &Clock,
) {
    controller::unset_user_data(
        iota_names,
        subname.nft(),
        key,
        clock,
    );
}
