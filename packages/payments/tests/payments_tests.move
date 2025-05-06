// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module iota_names_payments::payments_tests;

use std::{string::utf8, type_name};
use iota::{coin::{Self, CoinMetadata}, test_scenario::{Self as ts, ctx}, test_utils::destroy};
use iota_names::{payment, payment_tests::setup_iota_names, iota_names::{Self, IotaNames, AdminCap}};
use iota_names_payments::{
    payments::{
        new_payments_config,
        new_coin_type_data,
        handle_base_payment,
        PaymentsAuth,
        PaymentsConfig
    },
    testcoin::TESTCOIN,
    testusdc::TESTUSDC
};

public struct PaymentTestsCurrency has drop {}
public struct SPAM has drop {}

const IOTA_NAMES_ADDRESS: address = @0xA001;

public fun setup(ctx: &mut TxContext): (IotaNames, AdminCap) {
    let mut iota_names = setup_iota_names(ctx);
    let admin_cap = iota_names::create_admin_cap_for_testing(ctx);
    admin_cap.authorize<PaymentsAuth>(&mut iota_names);

    iota_names_payments::testusdc::test_init(ctx);
    iota_names_payments::testcoin::test_init(ctx);

    (iota_names, admin_cap)
}

#[test, expected_failure(abort_code = ::iota_names_payments::payments::EBaseCurrencySetupMissing)]
fun base_currency_not_in_list_e() {
    let mut test = ts::begin(IOTA_NAMES_ADDRESS);
    let (_iota_names, _admin_cap) = setup(test.ctx());

    test.next_tx(IOTA_NAMES_ADDRESS);
    let usdc_metadata = test.take_from_sender<CoinMetadata<TESTUSDC>>();
    let usdc_type_data = new_coin_type_data<TESTUSDC>(
        &usdc_metadata,
    );
    let mut setups = vector[];
    setups.push_back(usdc_type_data);

    let _config = new_payments_config(
        setups,
        type_name::get<SPAM>(),
    );

    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names_payments::payments::EInsufficientPayment)]
fun payment_insufficient_e() {
    let mut test = ts::begin(IOTA_NAMES_ADDRESS);
    let (mut iota_names, admin_cap) = setup(test.ctx());

    test.next_tx(IOTA_NAMES_ADDRESS);
    let usdc_metadata = test.take_from_sender<CoinMetadata<TESTUSDC>>();
    let usdc_type_data = new_coin_type_data<TESTUSDC>(
        &usdc_metadata,
    );
    let mut setups = vector[];
    setups.push_back(usdc_type_data);

    let config = new_payments_config(
        setups,
        type_name::get<TESTUSDC>(),
    );

    admin_cap.add_config<PaymentsConfig>(&mut iota_names, config);

    test.next_tx(IOTA_NAMES_ADDRESS);
    let intent = payment::init_registration(
        &mut iota_names,
        utf8(b"helloworld.iota"),
    );

    // 20 is required for registration, only 10 is minted
    let _receipt = handle_base_payment<TESTUSDC>(
        &mut iota_names,
        intent,
        coin::mint_for_testing<TESTUSDC>(10, test.ctx()),
    );

    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names_payments::payments::EInvalidPaymentType)]
fun invalid_payment_type_e() {
    let mut test = ts::begin(IOTA_NAMES_ADDRESS);
    let (mut iota_names, admin_cap) = setup(test.ctx());

    test.next_tx(IOTA_NAMES_ADDRESS);
    let usdc_metadata = test.take_from_sender<CoinMetadata<TESTUSDC>>();
    let usdc_type_data = new_coin_type_data<TESTUSDC>(
        &usdc_metadata,
    );
    let mut setups = vector[];
    setups.push_back(usdc_type_data);

    let config = new_payments_config(
        setups,
        type_name::get<TESTUSDC>(),
    );

    admin_cap.add_config<PaymentsConfig>(&mut iota_names, config);

    test.next_tx(IOTA_NAMES_ADDRESS);
    let intent = payment::init_registration(
        &mut iota_names,
        utf8(b"helloworld.iota"),
    );

    // 20 is required for registration, paying with SPAM fails
    let _receipt = handle_base_payment<SPAM>(
        &mut iota_names,
        intent,
        coin::mint_for_testing<SPAM>(20, test.ctx()),
    );

    abort 1337
}

#[test]
fun test_add_payment_config() {
    let mut test = ts::begin(IOTA_NAMES_ADDRESS);
    let (mut iota_names, admin_cap) = setup(test.ctx());

    test.next_tx(IOTA_NAMES_ADDRESS);
    let usdc_metadata = test.take_from_sender<CoinMetadata<TESTUSDC>>();
    let usdc_type_data = new_coin_type_data<TESTUSDC>(
        &usdc_metadata,
    );
    let ns_metadata = test.take_from_sender<CoinMetadata<TESTCOIN>>();
    let ns_type_data = new_coin_type_data<TESTCOIN>(
        &ns_metadata,
    );
    let mut setups = vector[];
    setups.push_back(usdc_type_data);
    setups.push_back(ns_type_data);

    let config = new_payments_config(
        setups,
        type_name::get<TESTUSDC>(),
    );

    admin_cap.add_config<PaymentsConfig>(&mut iota_names, config);

    test.next_tx(IOTA_NAMES_ADDRESS);
    let intent = payment::init_registration(
        &mut iota_names,
        utf8(b"helloworld.iota"),
    );

    // 20 is required for registration, paying with 20 usdc is successful
    let receipt = handle_base_payment<TESTUSDC>(
        &mut iota_names,
        intent,
        coin::mint_for_testing<TESTUSDC>(20, test.ctx()),
    );

    test.return_to_sender(usdc_metadata);
    test.return_to_sender(ns_metadata);

    destroy(receipt);
    destroy(admin_cap);
    destroy(iota_names);
    test.end();
}
