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
use iota_names::admin::{Self, AdminAuth};
use iota_names::constants;
use iota_names::domain;
use iota_names::registry;
use iota_names::iota_names;

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

    iota_names::authorize_for_testing<AdminAuth>(&mut iota_names);

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
