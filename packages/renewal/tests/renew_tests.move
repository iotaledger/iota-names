// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module renewal::renew_tests {
    use std::string::utf8;

    use iota::{coin, iota::IOTA, clock::{Self, Clock}};

    use iota_names::{
        constants::{nanos_per_iota, year_ms, grace_period_ms}, 
        iota_names::{Self, IotaNames}, 
        iota_names_registration::{Self as nft, IotaNamesRegistration}, 
        registry, 
        domain, 
        config
    };

    use renewal::renew::{Self as renewal, Renew};

    const REGULAR_PRICE: u64 = 35;

    const DOMAIN_NAME: vector<u8> = b"12345.iota";

    #[test]
    fun regular_renewal_5_years() {
        let mut ctx = tx_context::dummy();
        let (mut iota_names, mut nft) = prepare_registry(&mut ctx);

        let mut clock = clock::create_for_testing(&mut ctx);

        clock.increment_for_testing(10);

        renew_util(&mut iota_names, &mut nft, 5, &clock, &mut ctx);

        // our fresh domain with 5 years renewal is now 6 years
        assert!(nft.expiration_timestamp_ms() == clock.timestamp_ms() + (6 * year_ms()) - 10, 0);

        clock.destroy_for_testing();

        wrapup(iota_names);
        wrapup_name(nft);
    }

    #[test, expected_failure(abort_code= ::renewal::renew::EMoreThanSixYears)]
    fun fail_to_go_beyond_6_years() {
        let mut ctx = tx_context::dummy();
        let (mut iota_names, mut nft) = prepare_registry(&mut ctx);

        let clock = clock::create_for_testing(&mut ctx);
        
        renew_util(&mut iota_names, &mut nft, 2, &clock, &mut ctx);
        renew_util(&mut iota_names, &mut nft, 4, &clock, &mut ctx);
        abort 1337
    }

    #[test, expected_failure(abort_code= ::renewal::renew::EInvalidYearsArgument)]
    fun fail_invalid_arg() {
        let mut ctx = tx_context::dummy();
        let (mut iota_names, mut nft) = prepare_registry(&mut ctx);

        let clock = clock::create_for_testing(&mut ctx);
        
        renew_util(&mut iota_names, &mut nft, 6, &clock, &mut ctx);
        abort 1337
    }


    #[test, expected_failure(abort_code= ::renewal::renew::ERecordNftIDMismatch)]
    fun failed_record_id_mismatch() {
        let mut ctx = tx_context::dummy();
        let (mut iota_names, _nft) = prepare_registry(&mut ctx);
        let clock = clock::create_for_testing(&mut ctx);
        let mut nft = nft::new_for_testing(domain::new(utf8(DOMAIN_NAME)), 1, &clock, &mut ctx);
        
        renew_util(&mut iota_names, &mut nft, 3, &clock, &mut ctx);
        abort 1337
    }

    #[test, expected_failure(abort_code= ::renewal::renew::ERecordNotFound)]
    fun failed_record_not_exist() {
        let mut ctx = tx_context::dummy();
        let (mut iota_names, _nft) = prepare_registry(&mut ctx);
        let clock = clock::create_for_testing(&mut ctx);
        let mut nft = nft::new_for_testing(domain::new(utf8(b"hehehe.iota")), 1, &clock, &mut ctx);
        
        renew_util(&mut iota_names, &mut nft, 3, &clock, &mut ctx);
        abort 1337
    }

    #[test, expected_failure(abort_code= ::renewal::renew::ERecordExpired)]
    fun failed_expired_record() {
        let mut ctx = tx_context::dummy();
        let (mut iota_names, mut nft) = prepare_registry(&mut ctx);
        let mut clock = clock::create_for_testing(&mut ctx);
        
        clock::increment_for_testing(&mut clock, year_ms() + grace_period_ms() + 1);

        renew_util(&mut iota_names, &mut nft, 1, &clock, &mut ctx);
        abort 1337
    }

    #[test, expected_failure(abort_code= ::renewal::renew::EIncorrectAmount)]
    fun failed_not_enough_money() {
        let mut ctx = tx_context::dummy();
        let (mut iota_names, mut nft) = prepare_registry(&mut ctx);
        let clock = clock::create_for_testing(&mut ctx);
        
        renewal::renew(&mut iota_names, &mut nft, 2,coin::mint_for_testing<IOTA>((1 as u64) * REGULAR_PRICE * nanos_per_iota(), &mut ctx), &clock);
        abort 1337
    }
    
    public fun renew_util(iota_names: &mut IotaNames, nft: &mut IotaNamesRegistration, no_years: u8, clock: &Clock, ctx: &mut TxContext) {
        renewal::renew(iota_names, nft, no_years,coin::mint_for_testing<IOTA>((no_years as u64) * REGULAR_PRICE * nanos_per_iota(), ctx), clock);
    }

    /// Local test to prepare a registry with a domain. 
    /// Authorizes registry, adds domain, and burns admin cap.
    public fun prepare_registry(ctx: &mut TxContext): (IotaNames, IotaNamesRegistration) {

        let mut iota_names = iota_names::init_for_testing(ctx);
        let mut registry = registry::new_for_testing(ctx);

        let domain = domain::new(utf8(DOMAIN_NAME));        
        iota_names::authorize_app_for_testing<Renew>(&mut iota_names);

        let clock = clock::create_for_testing(ctx);

        let cap = iota_names::create_admin_cap_for_testing(ctx);

        let config = config::new(
            // We do not care about the public key of the configuration in tests.
            // Also, for renewals, we do not care about it in production mode too.
            // We re-use the type to be able to use the same utilities.
            b"000000000000000000000000000000000",
            // random price, not being tested in renewal tests.
            1200 * ::iota_names::constants::nanos_per_iota(),
            // Random price, not being tested in renewal tests.
            200 * ::iota_names::constants::nanos_per_iota(),
            REGULAR_PRICE * ::iota_names::constants::nanos_per_iota(),
        );

        renewal::setup(&mut iota_names, &cap, config);

        let nft = registry.add_record(domain, 1,&clock, ctx);
        iota_names::add_registry(&cap, &mut iota_names, registry);

        iota_names::burn_admin_cap_for_testing(cap);
        clock.destroy_for_testing();
    
        (iota_names, nft)
    }

    public fun wrapup_name(nft: IotaNamesRegistration) {
        iota::transfer::public_transfer(nft, @0x2);
    }

    public fun wrapup(iota_names: IotaNames) {
        iota_names.share_for_testing();
    }
}
