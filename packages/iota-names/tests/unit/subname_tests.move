// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
#[allow(lint(abort_without_constant))]
module iota_names::subname_registration_tests;

use iota::clock;
use iota_names::name;
use iota_names::iota_names_registration;
use iota_names::subname_registration as subname;
use std::string::utf8;

#[test]
fun test_wrap_and_destroy() {
    let mut ctx = tx_context::dummy();
    let mut clock = clock::create_for_testing(&mut ctx);

    let name = name::new(utf8(b"sub.example.iota"));

    let mut nft = iota_names_registration::new_for_testing(
        name,
        1,
        &clock,
        &mut ctx,
    );

    // create subname from name
    let mut sub_nft = subname::new(nft, &clock, &mut ctx);

    assert!(sub_nft.nft().name() == name, 1);

    // destroy subname (added mut borrow for coverage)
    clock.set_for_testing(sub_nft.nft_mut().expiration_timestamp_ms() + 1);

    nft = sub_nft.burn(&clock);

    nft.burn_for_testing();

    clock.destroy_for_testing();
}

#[test, expected_failure(abort_code = iota_names::subname_registration::ENotSubname)]
fun try_wrap_non_subname() {
    let mut ctx = tx_context::dummy();
    let clock = clock::create_for_testing(&mut ctx);

    let nft = iota_names_registration::new_for_testing(
        name::new(utf8(b"example.iota")),
        1,
        &clock,
        &mut ctx,
    );

    // create subname from name
    let _sub_nft = subname::new(nft, &clock, &mut ctx);

    abort 1337
}

#[test, expected_failure(abort_code = iota_names::subname_registration::ENftExpired)]
fun try_wrap_expired_subname() {
    let mut ctx = tx_context::dummy();
    let mut clock = clock::create_for_testing(&mut ctx);

    let nft = iota_names_registration::new_for_testing(
        name::new(utf8(b"sub.example.iota")),
        1,
        &clock,
        &mut ctx,
    );
    clock.set_for_testing(nft.expiration_timestamp_ms() + 1);

    // create subname from name
    let _sub_nft = subname::new(nft, &clock, &mut ctx);

    abort 1337
}

#[test, expected_failure(abort_code = iota_names::subname_registration::ENameNotExpired)]
fun try_unwrap_non_expired_subname() {
    let mut ctx = tx_context::dummy();
    let clock = clock::create_for_testing(&mut ctx);

    let nft = iota_names_registration::new_for_testing(
        name::new(utf8(b"sub.example.iota")),
        1,
        &clock,
        &mut ctx,
    );

    // create subname from name
    let sub_nft = subname::new(nft, &clock, &mut ctx);

    // try to destroy
    let _nft = sub_nft.burn(&clock);

    abort 1337
}
