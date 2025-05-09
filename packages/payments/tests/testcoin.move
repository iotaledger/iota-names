// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module iota_names_payments::testcoin;

use iota::coin;

public struct TESTCOIN has drop {}

fun init(witness: TESTCOIN, ctx: &mut TxContext) {
    let (treasury_cap, metadata) = coin::create_currency<TESTCOIN>(
        witness,
        6,
        vector[],
        vector[],
        vector[],
        option::none(),
        ctx,
    );

    transfer::public_transfer(metadata, tx_context::sender(ctx));
    transfer::public_transfer(treasury_cap, tx_context::sender(ctx));
}

public fun test_init(ctx: &mut TxContext) {
    init(TESTCOIN {}, ctx);
}
