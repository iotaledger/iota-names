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

    use iotans::{
        domain,
        registry::Registry,
        iotans::{Self, IotaNS},
        config::{Self, Config},
        iotans_registration::IotansRegistration
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
        iotans: &mut IotaNS,
        domain_name: String,
        no_years: u8,
        payment: Coin<IOTA>,
        clock: &Clock,
        ctx: &mut TxContext
    ): IotansRegistration {
        iotans.assert_app_is_authorized<Register>();

        let config = iotans.get_config<Config>();

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

        iotans::app_add_balance(
            Register {},
            iotans,
            payment.into_balance()
        );
        let registry = iotans::app_registry_mut<Register, Registry>(Register {}, iotans);
        registry.add_record(domain, no_years, clock, ctx)
    }
}
