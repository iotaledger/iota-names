// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// A simple package to allows us set a target address &  default name in a single PTB in frontend.
/// Unblocks better UX in the registration flow.
module utils::direct_setup {
    use std::string::String;

    use iota::clock::Clock;

    use iota_names::{
        domain,
        registry::Registry,
        iota_names::{Self, IotaNames},
        iota_names_registration::IotaNamesRegistration,
        subdomain_registration::SubDomainRegistration
    };

    /// Tries to add not supported user data in the vecmap of the name record.
    const EUnsupportedKey: u64 = 1;

    const AVATAR: vector<u8> = b"avatar";
    const CONTENT_HASH: vector<u8> = b"content_hash";

    /// Authorization token for the controller.
    public struct DirectSetup has drop {}

    /// Set the target address of a domain.
    public fun set_target_address(
        iota_names: &mut IotaNames,
        nft: &IotaNamesRegistration,
        new_target: Option<address>,
        clock: &Clock,
    ) {
        let registry = registry_mut(iota_names);
        registry.assert_nft_is_authorized(nft, clock);

        let domain = nft.domain();
        registry.set_target_address(domain, new_target);
    }

    /// Set the reverse lookup address for the domain
    public fun set_reverse_lookup(
        iota_names: &mut IotaNames,
        domain_name: String,
        ctx: &TxContext
    ) {
        registry_mut(iota_names).set_reverse_lookup(
            ctx.sender(),
            domain::new(domain_name)
        );
    }

    /// User-facing function - unset the reverse lookup address for the domain.
    public fun unset_reverse_lookup(iota_names: &mut IotaNames, ctx: &TxContext) {
        registry_mut(iota_names).unset_reverse_lookup(ctx.sender());
    }

    /// User-facing function - add a new key-value pair to the name record's data.
    public fun set_user_data(
        iota_names: &mut IotaNames,
        nft: &IotaNamesRegistration, key: String,
        value: String,
        clock: &Clock
    ) {
        let registry = registry_mut(iota_names);
        let mut data = *registry.get_data(nft.domain());
        let domain = nft.domain();

        registry.assert_nft_is_authorized(nft, clock);
        let key_bytes = *key.bytes();
        assert!(
            key_bytes == AVATAR || key_bytes == CONTENT_HASH,
            EUnsupportedKey
        );

        if (data.contains(&key)) {
            data.remove(&key);
        };

        data.insert(key, value);
        registry.set_data(domain, data);
    }

    /// User-facing function - remove a key from the name record's data.
    public fun unset_user_data(
        iota_names: &mut IotaNames,
        nft: &IotaNamesRegistration, key: String,
        clock: &Clock
    ) {
        let registry = registry_mut(iota_names);
        let mut data = *registry.get_data(nft.domain());
        let domain = nft.domain();

        registry.assert_nft_is_authorized(nft, clock);

        if (data.contains(&key)) {
            data.remove(&key);
        };

        registry.set_data(domain, data);
    }

    public fun burn_expired(
        iota_names: &mut IotaNames,
        nft: IotaNamesRegistration,
        clock: &Clock
    ) {
        registry_mut(iota_names).burn_registration_object(nft, clock);
    }

    public fun burn_expired_subname(
        iota_names: &mut IotaNames,
        nft: SubDomainRegistration,
        clock: &Clock
    ) {
        registry_mut(iota_names).burn_subdomain_object(nft, clock);
    }

    fun registry_mut(iota_names: &mut IotaNames): &mut Registry {
        iota_names::app_registry_mut<DirectSetup, Registry>(DirectSetup {}, iota_names)
    }
}
