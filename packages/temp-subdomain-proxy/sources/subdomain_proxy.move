// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// A `temporary` proxy used to proxy subdomain requests
/// because we can't use references in a PTB.
///
/// Module has no tests as it's a plain proxy for other function calls.
/// All validation happens on those functions.
///
/// This package will stop being used when we've implemented references in PTBs.
module temp_subdomain_proxy::subdomain_proxy;

use iota::clock::Clock;
use iota_names::{controller, iota_names::IotaNames, subdomain_registration::SubDomainRegistration};
use std::string::String;
use subdomains::subdomains;

public fun new(
    iota_names: &mut IotaNames,
    subdomain: &SubDomainRegistration,
    clock: &Clock,
    subdomain_name: String,
    expiration_timestamp_ms: u64,
    allow_creation: bool,
    allow_time_extension: bool,
    ctx: &mut TxContext,
): SubDomainRegistration {
    subdomains::new(
        iota_names,
        subdomain.nft(),
        clock,
        subdomain_name,
        expiration_timestamp_ms,
        allow_creation,
        allow_time_extension,
        ctx,
    )
}

public fun new_leaf(
    iota_names: &mut IotaNames,
    subdomain: &SubDomainRegistration,
    clock: &Clock,
    subdomain_name: String,
    target: address,
    ctx: &mut TxContext,
) {
    subdomains::new_leaf(
        iota_names,
        subdomain.nft(),
        clock,
        subdomain_name,
        target,
        ctx,
    );
}

public fun remove_leaf(
    iota_names: &mut IotaNames,
    subdomain: &SubDomainRegistration,
    clock: &Clock,
    subdomain_name: String,
) {
    subdomains::remove_leaf(
        iota_names,
        subdomain.nft(),
        clock,
        subdomain_name,
    );
}

public fun edit_setup(
    iota_names: &mut IotaNames,
    parent: &SubDomainRegistration,
    clock: &Clock,
    subdomain_name: String,
    allow_creation: bool,
    allow_time_extension: bool,
) {
    subdomains::edit_setup(
        iota_names,
        parent.nft(),
        clock,
        subdomain_name,
        allow_creation,
        allow_time_extension,
    );
}

public fun set_target_address(
    iota_names: &mut IotaNames,
    subdomain: &SubDomainRegistration,
    new_target: Option<address>,
    clock: &Clock,
) {
    controller::set_target_address(
        iota_names,
        subdomain.nft(),
        new_target,
        clock,
    );
}

public fun set_user_data(
    iota_names: &mut IotaNames,
    subdomain: &SubDomainRegistration,
    key: String,
    value: String,
    clock: &Clock,
) {
    controller::set_user_data(
        iota_names,
        subdomain.nft(),
        key,
        value,
        clock,
    );
}

public fun unset_user_data(
    iota_names: &mut IotaNames,
    subdomain: &SubDomainRegistration,
    key: String,
    clock: &Clock,
) {
    controller::unset_user_data(
        iota_names,
        subdomain.nft(),
        key,
        clock,
    );
}
