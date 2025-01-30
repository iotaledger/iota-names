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
module temp_subdomain_proxy::subdomain_proxy {
    use std::string::String;

    use iota::clock::Clock;

    use iotans::{
        iotans::IOTANS,
        subdomain_registration::SubDomainRegistration
    };

    use subdomains::subdomains;
    use utils::direct_setup;

    public fun new(
        iotans: &mut IOTANS,
        subdomain: &SubDomainRegistration,
        clock: &Clock,
        subdomain_name: String,
        expiration_timestamp_ms: u64,
        allow_creation: bool,
        allow_time_extension: bool,
        ctx: &mut TxContext
    ): SubDomainRegistration {
        subdomains::new(
            iotans,
            subdomain.nft(),
            clock,
            subdomain_name,
            expiration_timestamp_ms,
            allow_creation,
            allow_time_extension,
            ctx
        )
    }

    public fun new_leaf(
        iotans: &mut IOTANS,
        subdomain: &SubDomainRegistration,
        clock: &Clock,
        subdomain_name: String,
        target: address,
        ctx: &mut TxContext
    ) {
        subdomains::new_leaf(
            iotans,
            subdomain.nft(),
            clock,
            subdomain_name,
            target,
            ctx
        );
    }

    public fun remove_leaf(
        iotans: &mut IOTANS,
        subdomain: &SubDomainRegistration,
        clock: &Clock,
        subdomain_name: String,
    ) {
        subdomains::remove_leaf(
            iotans,
            subdomain.nft(),
            clock,
            subdomain_name,
        );
    }

    public fun edit_setup(
        iotans: &mut IOTANS,
        parent: &SubDomainRegistration,
        clock: &Clock,
        subdomain_name: String,
        allow_creation: bool,
        allow_time_extension: bool
    ) {
        subdomains::edit_setup(
            iotans,
            parent.nft(),
            clock,
            subdomain_name,
            allow_creation,
            allow_time_extension
        );
    }

    public fun set_target_address(
        iotans: &mut IOTANS,
        subdomain: &SubDomainRegistration,
        new_target: Option<address>,
        clock: &Clock,
    ) {
        direct_setup::set_target_address(
            iotans,
            subdomain.nft(),
            new_target,
            clock,
        );
    }

    public fun set_user_data(
        iotans: &mut IOTANS,
        subdomain: &SubDomainRegistration, key: String,
        value: String,
        clock: &Clock
    ) {
        direct_setup::set_user_data(
            iotans,
            subdomain.nft(), key,
            value,
            clock
        );
    }

    public fun unset_user_data(
        iotans: &mut IOTANS,
        subdomain: &SubDomainRegistration, key: String,
        clock: &Clock
    ) {
        direct_setup::unset_user_data(iotans, subdomain.nft(), key, clock);
    }
}
