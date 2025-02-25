// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// Utilities for simpler usage of the Iota Names package.
module utils::utils {
    use std::string::String;

    use iota::{
        coin::Coin,
        clock::Clock,
        iota::IOTA,
        tx_context::sender
    };

    use registration::register::register as ns_register;
    use renewal::renew::renew as ns_renew;
    use iota_names::{
        domain,
        config::Config,
        registry::Registry,
        iota_names::{Self, IotaNames},
        iota_names_registration::IotaNamesRegistration,
        subdomain_registration::SubDomainRegistration
    };

    /// Payment is too small.
    const EPaymentTooSmall: u64 = 0;
    /// Tries to add not supported user data in the vecmap of the name record.
    const EUnsupportedKey: u64 = 1;

    const AVATAR: vector<u8> = b"avatar";
    const CONTENT_HASH: vector<u8> = b"content_hash";

    /// Authorization token for the utilities.
    public struct Utilities has drop {}

    /// Register a new name for a number of years.
    public fun register(
        iota_names: &mut IotaNames,
        domain_name: String,
        num_years: u8,
        payment: &mut Coin<IOTA>,
        set_reverse_lookup: bool,
        clock: &Clock,
        ctx: &mut TxContext
    ): IotaNamesRegistration {
        let sender = sender(ctx);
        let config = iota_names.get_config<Config>();
        let price = config.calculate_price(domain_name.length() as u8, num_years);

        assert!(payment.value() >= price, EPaymentTooSmall);

        // Split off the needed payment
        let payment = payment.split(price, ctx);

        let registration = ns_register(iota_names, domain_name, num_years, payment, clock, ctx);

        set_target_address(iota_names, &registration, std::option::some(sender), clock);

        if (set_reverse_lookup) {
            set_reverse_lookup(iota_names, domain_name, ctx);
        };

        registration
    }

    /// Rener an existing name for a number of years.
    public fun renew(
        iota_names: &mut IotaNames,
        nft: &mut IotaNamesRegistration,
        num_years: u8,
        payment: &mut Coin<IOTA>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let config = iota_names.get_config<Config>();
        let domain_name = nft.domain_name();
        let price = config.calculate_price(domain_name.length() as u8, num_years);

        assert!(payment.value() >= price, EPaymentTooSmall);

        // Split off the needed payment
        let payment = payment.split(price, ctx);

        ns_renew(iota_names, nft, num_years, payment, clock);
    }

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

    /// Unset the reverse lookup address for the domain.
    public fun unset_reverse_lookup(iota_names: &mut IotaNames, ctx: &TxContext) {
        registry_mut(iota_names).unset_reverse_lookup(ctx.sender());
    }

    /// Add a new key-value pair to the name record's data.
    public fun set_user_data(
        iota_names: &mut IotaNames,
        nft: &IotaNamesRegistration, 
        key: String,
        value: String,
        clock: &Clock
    ) {
        let registry = registry_mut(iota_names);
        let mut data = *registry.get_data(nft.domain());
        let domain = nft.domain();

        registry.assert_nft_is_authorized(nft, clock);
        let key_bytes = *key.as_bytes();
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

    /// Remove a key from the name record's data.
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
        iota_names::app_registry_mut<Utilities, Registry>(Utilities {}, iota_names)
    }

    // === Testing ===

    #[test_only]
    public fun set_target_address_for_testing(
        iota_names: &mut IotaNames,
        nft: &IotaNamesRegistration,
        new_target: Option<address>,
        clock: &Clock,
    ) {
        set_target_address(iota_names, nft, new_target, clock)
    }

    #[test_only]
    public fun set_reverse_lookup_for_testing(
        iota_names: &mut IotaNames,
        domain_name: String,
        ctx: &TxContext,
    ) {
        set_reverse_lookup(iota_names, domain_name, ctx)
    }

    #[test_only]
    public fun unset_reverse_lookup_for_testing(
        iota_names: &mut IotaNames,
        ctx: &TxContext,
    ) {
        unset_reverse_lookup(iota_names, ctx)
    }

    #[test_only]
    public fun set_user_data_for_testing(
        iota_names: &mut IotaNames,
        nft: &IotaNamesRegistration,
        key: String,
        value: String,
        clock: &Clock,
    ) {
        set_user_data(iota_names, nft, key, value, clock);
    }

    #[test_only]
    public fun unset_user_data_for_testing(
        iota_names: &mut IotaNames,
        nft: &IotaNamesRegistration,
        key: String,
        clock: &Clock,
    ) {
        unset_user_data(iota_names, nft, key, clock);
    }
}
