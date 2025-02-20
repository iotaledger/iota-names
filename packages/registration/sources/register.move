// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

module registration::register {
    use std::string::String;
    use iota::{
        coin::Coin,
        clock::Clock,
        iota::IOTA
    };

    use iota_names::{
        domain,
        registry::Registry,
        iota_names::{Self, IotaNames},
        config::{Self, Config},
        iota_names_nft::IotaNamesNft
    };

    /// Number of years passed is not within [1-5] interval.
    const EInvalidYearsArgument: u64 = 0;
    /// Trying to register a subdomain (only *.iota is currently allowed).
    /// The payment does not match the price for the domain.
    const EIncorrectAmount: u64 = 4;

    /// Authorization token for the app.
    public struct Register has drop {}

    // Allows direct purchases of domains
    //
    // Makes sure that:
    // - the domain is not already registered (or, if active, expired)
    // - the domain TLD is .iota
    // - the domain is not a subdomain
    // - number of years is within [1-5] interval
    public fun register(
        iota_names: &mut IotaNames,
        domain_name: String,
        no_years: u8,
        payment: Coin<IOTA>,
        clock: &Clock,
        ctx: &mut TxContext
    ): IotaNamesNft {
        iota_names.assert_app_is_authorized<Register>();

        let config = iota_names.get_config<Config>();

        let domain = domain::new(domain_name);
        config::assert_valid_user_registerable_domain(&domain);

        assert!(
            0 < no_years && no_years <= 5,
            EInvalidYearsArgument
        );

        let label = domain.sld();
        let price = config.calculate_price((label.length() as u8), no_years);

        assert!(
            payment.value() == price,
            EIncorrectAmount
        );

        iota_names::app_add_balance(
            Register {},
            iota_names,
            payment.into_balance()
        );
        let registry = iota_names::app_registry_mut<Register, Registry>(Register {}, iota_names);
        registry.add_record(domain, no_years, clock, ctx)
    }
}
