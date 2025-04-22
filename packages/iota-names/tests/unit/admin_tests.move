// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
#[allow(lint(abort_without_constant))]
/// Testing strategy:
///
/// - Admin can add new records to IotaNames and get the IotaNamesRegistrations
/// for the registered domains.
/// - Admin keeps the registration NFTs at their account for now.
///
module iota_names::admin_tests;

use std::string::utf8;
use iota::clock;
use iota::test_utils::assert_eq;
use iota_names::admin::{Self, Admin};
use iota_names::constants;
use iota_names::domain;
use iota_names::registry;
use iota_names::iota_names::{Self, IotaNames, AdminCap};
use iota_names::iota_names_registration::IotaNamesRegistration;

#[test, expected_failure(abort_code = ::iota_names::iota_names::EAppNotAuthorized)]
fun try_unauthorized_fail() {
    let mut ctx = tx_context::dummy();
    let mut iota_names = iota_names::init_for_testing(&mut ctx);
    let cap = iota_names::create_admin_cap_for_testing(&mut ctx);
    let clock = clock::create_for_testing(&mut ctx);

    let _nft = admin::reserve_domain(
        &cap,
        &mut iota_names,
        utf8(b"test.iota"),
        1,
        &clock,
        &mut ctx,
    );

    abort 1337
}

#[test]
fun authorized() {
    let mut ctx = tx_context::dummy();
    let mut iota_names = iota_names::init_for_testing(&mut ctx);
    let cap = iota_names::create_admin_cap_for_testing(&mut ctx);
    let clock = clock::create_for_testing(&mut ctx);
    registry::init_for_testing(&cap, &mut iota_names, &mut ctx);

    iota_names::authorize_app_for_testing<Admin>(&mut iota_names);

    let nft = admin::reserve_domain(
        &cap,
        &mut iota_names,
        utf8(b"test.iota"),
        1,
        &clock,
        &mut ctx,
    );

    assert_eq(nft.domain(), domain::new(utf8(b"test.iota")));
    assert_eq(nft.expiration_timestamp_ms(), constants::year_ms());

    nft.burn_for_testing();
    clock.destroy_for_testing();
    iota_names::burn_admin_cap_for_testing(cap);
    iota_names::share_for_testing(iota_names);
}

#[test]
fun register_multiple() {
    let ctx = tx_context::dummy();
    let mut scenario = iota::test_scenario::begin(ctx.sender());

    {
        let iota_names = iota_names::init_for_testing(scenario.ctx());
        iota_names.share_for_testing();
    };

    let domains = vector[
        utf8(b"domain1.iota"),
        utf8(b"domain2.iota"),
        utf8(b"domain3.iota"),
        utf8(b"domain4.iota")
    ];
    
    {
        scenario.next_tx(ctx.sender());

        let mut iota_names = scenario.take_shared<IotaNames>();
        let admin_cap = scenario.take_from_sender<AdminCap>();
        let clock = clock::create_for_testing(scenario.ctx());
        
        registry::init_for_testing(&admin_cap, &mut iota_names, scenario.ctx());

        iota_names::authorize_app_for_testing<Admin>(&mut iota_names);

        admin::reserve_domains(
            &admin_cap,
            &mut iota_names,
            copy domains,
            1,
            &clock,
            scenario.ctx()
        );

        clock.share_for_testing();
        scenario.return_to_sender(admin_cap);
        iota::test_scenario::return_shared(iota_names);
    };

    {
        scenario.next_tx(ctx.sender());

        let mut ids = scenario.ids_for_sender<IotaNamesRegistration>();
        assert_eq(ids.length(), domains.length());
        while (!ids.is_empty()) {
            let nft = scenario.take_from_sender_by_id<IotaNamesRegistration>(ids.pop_back());
            assert!(vector::contains(&domains, &nft.domain().to_string()));
            assert_eq(nft.expiration_timestamp_ms(), constants::year_ms());
            scenario.return_to_sender(nft);
        };
    };

    scenario.end();
}
