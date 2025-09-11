// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
#[allow(lint(abort_without_constant))]
module iota_names::payment_tests;

use iota::clock;
use iota::coin;
use iota::iota::IOTA;
use iota::test_utils::{assert_eq, destroy};
use iota_names::constants;
use iota_names::core_config;
use iota_names::name;
use iota_names::iota_names::{Self, IotaNames};
use iota_names::name_registration;
use iota_names::payment::{Self, PaymentIntent, Receipt};
use iota_names::pricing_config::{Self, PricingConfig};
use iota_names::registry::Registry;
use iota_names::test_init_utils;

/// Authorization witness to call protected functions of `iota_names`.
public struct PaymentsAuth has drop {}

#[test]
fun test_e2e() {
    let mut ctx = tx_context::dummy();
    let mut iota_names = setup_iota_names(&mut ctx);
    let clock = clock::create_for_testing(&mut ctx);

    let name = b"test.iota".to_string();

    let intent = payment::init_registration(
        &mut iota_names,
        name,
    );
    // checking the price is valid.
    assert_eq(intent.request_data().base_amount(), 100);

    // calling our "payments" package here.
    let receipt = handle_payment(intent, &mut iota_names, &mut ctx);

    // Now we can use our receipt to get a IotaNames name directly from the core protocol.
    let mut nft = receipt.register(&mut iota_names, &clock, &mut ctx);

    // let's validate our nft is the same name we expected for sanity check.
    assert_eq(nft.name_str(), name);

    // now let's renew this nft for 4 years.
    let intent = payment::init_renewal(&mut iota_names, &nft, 4);

    // Checking the price is valid.
    assert_eq(intent.request_data().base_amount(), 10 * 4);
    assert_eq(intent.request_data().years(), 4);
    assert_eq(intent.request_data().name().to_string(), name);

    // calling our "payments" package here.
    let receipt = handle_payment(intent, &mut iota_names, &mut ctx);

    // our nft expires in exactly 1 year (1 from purchase).
    assert_eq(nft.expiration_timestamp_ms(), constants::year_ms());

    // now using our renewal receipt, we can renew the NFT.
    receipt.renew(&mut iota_names, &mut nft, &clock, &mut ctx);

    // our nft expires in exactly 5 years (1 from purchase + 4 from renewal).
    assert_eq(nft.expiration_timestamp_ms(), constants::year_ms() * 5);

    destroy(iota_names);
    destroy(nft);
    destroy(clock);
}

#[test, expected_failure(abort_code = ::iota_names::payment::ENotSupportedType)]
fun try_to_register_using_renewal_receipt() {
    let mut ctx = tx_context::dummy();
    let mut iota_names = setup_iota_names(&mut ctx);
    let clock = clock::create_for_testing(&mut ctx);

    let receipt = payment::test_renewal_receipt(
        b"test.iota".to_string(),
        4,
        1, // version should be valid here.
    );

    let _nft = receipt.register(&mut iota_names, &clock, &mut ctx);

    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names::payment::ENotSupportedType)]
fun try_to_renew_using_registration_receipt() {
    let mut ctx = tx_context::dummy();
    let mut iota_names = setup_iota_names(&mut ctx);
    let clock = clock::create_for_testing(&mut ctx);

    let mut nft = name_registration::new_for_testing(
        name::new(b"test.iota".to_string()),
        1,
        &clock,
        &mut ctx,
    );

    let receipt = payment::test_registration_receipt(
        b"test.iota".to_string(),
        1,
        1, // version should be valid here.
    );

    receipt.renew(&mut iota_names, &mut nft, &clock, &mut ctx);
    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names::payment::EReceiptNameMismatch)]
fun try_to_renew_with_other_name_receipt() {
    let mut ctx = tx_context::dummy();
    let mut iota_names = setup_iota_names(&mut ctx);
    let clock = clock::create_for_testing(&mut ctx);

    let mut nft = name_registration::new_for_testing(
        name::new(b"test2.iota".to_string()),
        1,
        &clock,
        &mut ctx,
    );

    let receipt = payment::test_renewal_receipt(
        b"test.iota".to_string(),
        1,
        constants::payments_version!(), // version should be valid here.
    );

    receipt.renew(&mut iota_names, &mut nft, &clock, &mut ctx);
    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names::payment::EVersionMismatch)]
fun try_to_register_using_invalid_receipt_version() {
    let mut ctx = tx_context::dummy();
    let mut iota_names = setup_iota_names(&mut ctx);
    let clock = clock::create_for_testing(&mut ctx);

    let receipt = payment::test_registration_receipt(
        b"test.iota".to_string(),
        1,
        2, // version should be valid here.
    );

    let _nft = receipt.register(&mut iota_names, &clock, &mut ctx);

    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names::payment::EVersionMismatch)]
fun try_to_renew_using_invalid_receipt_version() {
    let mut ctx = tx_context::dummy();
    let mut iota_names = setup_iota_names(&mut ctx);
    let clock = clock::create_for_testing(&mut ctx);

    let mut nft = name_registration::new_for_testing(
        name::new(b"test.iota".to_string()),
        1,
        &clock,
        &mut ctx,
    );

    let receipt = payment::test_renewal_receipt(
        b"test.iota".to_string(),
        1,
        255, // version should be valid here.
    );

    receipt.renew(&mut iota_names, &mut nft, &clock, &mut ctx);

    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names::payment::ECannotRenewSubname)]
fun try_to_renew_subname() {
    let mut ctx = tx_context::dummy();
    let mut iota_names = setup_iota_names(&mut ctx);
    let clock = clock::create_for_testing(&mut ctx);

    let registry = iota_names.pkg_registry_mut<Registry>();
    // forceful scenario, cannot add a subname like that.
    let nft = registry.add_record(
        name::new(b"inner.test.iota".to_string()),
        1,
        &clock,
        &mut ctx,
    );

    let _receipt = payment::init_renewal(&mut iota_names, &nft, 1);
    abort 1337
}

#[test]
fun test_renew_data_mut() {
    let mut ctx = tx_context::dummy();
    let mut iota_names = setup_iota_names(&mut ctx);
    let clock = clock::create_for_testing(&mut ctx);

    // Register a name
    let name = b"test.iota".to_string();
    let intent = payment::init_registration(
        &mut iota_names,
        name,
    );
    let receipt = handle_payment(intent, &mut iota_names, &mut ctx);
    let nft = receipt.register(&mut iota_names, &clock, &mut ctx);

    // Start renewal process so we can test request_data_mut()
    let mut intent = payment::init_renewal(&mut iota_names, &nft, 1);
    let _request_data_mut = intent.request_data_mut(&iota_names, PaymentsAuth {});

    destroy(intent);
    destroy(iota_names);
    destroy(nft);
    destroy(clock);
}

#[test, expected_failure(abort_code = ::iota_names::payment::ERecordExpired)]
fun try_renewing_expired_name() {
    let mut ctx = tx_context::dummy();
    let mut iota_names = setup_iota_names(&mut ctx);
    let mut clock = clock::create_for_testing(&mut ctx);

    let registry = iota_names.pkg_registry_mut<Registry>();
    // forceful scenario, cannot add a subname like that.
    let mut nft = registry.add_record(
        name::new(b"test.iota".to_string()),
        1,
        &clock,
        &mut ctx,
    );

    let receipt = payment::test_renewal_receipt(
        b"test.iota".to_string(),
        1,
        constants::payments_version!(), // version should be valid here.
    );

    clock.increment_for_testing(constants::year_ms() + constants::grace_period_ms() + 1);
    receipt.renew(&mut iota_names, &mut nft, &clock, &mut ctx);

    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names::payment::ERecordNotFound)]
fun try_renewing_non_existent_name() {
    let mut ctx = tx_context::dummy();
    let mut iota_names = setup_iota_names(&mut ctx);
    let clock = clock::create_for_testing(&mut ctx);

    let mut nft = name_registration::new_for_testing(
        name::new(b"test.iota".to_string()),
        1,
        &clock,
        &mut ctx,
    );

    let receipt = payment::test_renewal_receipt(
        b"test.iota".to_string(),
        1,
        constants::payments_version!(), // version should be valid here.
    );

    receipt.renew(&mut iota_names, &mut nft, &clock, &mut ctx);

    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names::payment::ECannotExceedMaxYears)]
fun try_to_renew_for_too_long() {
    let mut ctx = tx_context::dummy();
    let mut iota_names = setup_iota_names(&mut ctx);
    let clock = clock::create_for_testing(&mut ctx);

    let name = b"test.iota".to_string();

    let intent = payment::init_registration(&mut iota_names, name);
    let receipt = handle_payment(intent, &mut iota_names, &mut ctx);
    let mut nft = receipt.register(&mut iota_names, &clock, &mut ctx);

    let receipt = payment::test_renewal_receipt(name, 6, constants::payments_version!());

    receipt.renew(&mut iota_names, &mut nft, &clock, &mut ctx);

    abort 1337
}

#[test, expected_failure(abort_code = ::iota_names::payment::ECannotExceedMaxYears)]
fun try_renewal_process_longer_than_max_years() {
    let mut ctx = tx_context::dummy();
    let mut iota_names = setup_iota_names(&mut ctx);
    let clock = clock::create_for_testing(&mut ctx);

    let nft = name_registration::new_for_testing(
        name::new(b"test.iota".to_string()),
        1,
        &clock,
        &mut ctx,
    );

    let _intent = payment::init_renewal(&mut iota_names, &nft, 6);

    abort 1337
}

#[test]
fun test_base_amount() {
    let mut ctx = tx_context::dummy();
    let mut iota_names = setup_iota_names(&mut ctx);
    let name = b"test.iota".to_string();

    // Create a payment intent to test various functions
    let mut intent = payment::init_registration(&mut iota_names, name);
    
    // Test request_base_amount() function
    let base_amount = intent.request_base_amount();
    assert_eq(base_amount, 100);
    
    // Test request_data_mut() function with authorized app
    let request_data_mut = intent.request_data_mut(&iota_names, PaymentsAuth {});
    
    // Test base_amount_mut() function
    let base_amount_mut_ref = request_data_mut.base_amount_mut();
    *base_amount_mut_ref = 150; // Modify the base amount
    
    // Test metadata() function
    let metadata_ref = request_data_mut.metadata();
    assert_eq(metadata_ref.size(), 0); // Should be empty initially
    
    // Test metadata_mut() function
    let metadata_mut_ref = request_data_mut.metadata_mut();
    metadata_mut_ref.insert(b"discount".to_string(), b"10%".to_string());
    
    // Verify the metadata was updated
    assert_eq(request_data_mut.metadata().size(), 1);
    
    // Verify the base amount was updated
    assert_eq(intent.request_base_amount(), 150);
    
    // Clean up
    destroy(intent);
    destroy(iota_names);
}

#[test]
fun test_calculate_total_after_discount() {
    let mut ctx = tx_context::dummy();
    let mut iota_names = setup_iota_names(&mut ctx);

    let name = b"test.iota".to_string();

    // Create a payment intent to get request data
    let intent = payment::init_registration(&mut iota_names, name);
    let request_data = intent.request_data();

    // Test with 0% discount
    let price_0_percent = payment::calculate_total_after_discount(request_data, 0);
    assert_eq(price_0_percent, 100); // original price should be unchanged

    // Test with 25% discount
    let price_25_percent = payment::calculate_total_after_discount(request_data, 25);
    assert_eq(price_25_percent, 75); // 100 - (100 * 25 / 100) = 75

    // Test with 50% discount
    let price_50_percent = payment::calculate_total_after_discount(request_data, 50);
    assert_eq(price_50_percent, 50); // 100 - (100 * 50 / 100) = 50

    // Test with 75% discount
    let price_75_percent = payment::calculate_total_after_discount(request_data, 75);
    assert_eq(price_75_percent, 25); // 100 - (100 * 75 / 100) = 25

    // Test with 100% discount (should be free)
    let price_100_percent = payment::calculate_total_after_discount(request_data, 100);
    assert_eq(price_100_percent, 0); // 100 - (100 * 100 / 100) = 0

    destroy(intent);
    destroy(iota_names);
}

#[test]
fun test_init_registration_with_years() {
    let mut ctx = tx_context::dummy();
    let mut iota_names = setup_iota_names(&mut ctx);
    let clock = clock::create_for_testing(&mut ctx);

    let name = b"test.iota".to_string();

    // Test 1 year registration (should be same as normal registration)
    let intent_1_year = payment::init_registration_with_years(&mut iota_names, name, 1);
    assert_eq(intent_1_year.request_data().base_amount(), 100); // registration price for 4-char name
    assert_eq(intent_1_year.request_data().years(), 1);

    // Test 3 year registration (1 year registration + 2 years renewal)
    // Registration: 100, Renewal: 10 per year, so total = 100 + (10 * 2) = 120
    let intent_3_years = payment::init_registration_with_years(&mut iota_names, name, 3);
    assert_eq(intent_3_years.request_data().base_amount(), 120);
    assert_eq(intent_3_years.request_data().years(), 3);

    // Test 5 year registration (1 year registration + 4 years renewal)
    // Registration: 100, Renewal: 10 per year, so total = 100 + (10 * 4) = 140
    let intent_5_years = payment::init_registration_with_years(&mut iota_names, name, 5);
    assert_eq(intent_5_years.request_data().base_amount(), 140);
    assert_eq(intent_5_years.request_data().years(), 5);

    // Clean up
    destroy(intent_1_year);
    destroy(intent_3_years);
    destroy(intent_5_years);
    destroy(iota_names);
    destroy(clock);
}

#[test]
fun test_init_registration_with_years_different_name_lengths() {
    let mut ctx = tx_context::dummy();
    let mut iota_names = setup_iota_names(&mut ctx);
    let clock = clock::create_for_testing(&mut ctx);

    // Test 3-character name for 2 years
    // Registration: 500, Renewal: 50 per year, so total = 500 + (50 * 1) = 550
    let intent_3_char = payment::init_registration_with_years(&mut iota_names, b"abc.iota".to_string(), 2);
    assert_eq(intent_3_char.request_data().base_amount(), 550);
    assert_eq(intent_3_char.request_data().years(), 2);

    // Test 5+ character name for 3 years
    // Registration: 20, Renewal: 2 per year, so total = 20 + (2 * 2) = 24
    let intent_5_char = payment::init_registration_with_years(&mut iota_names, b"testing.iota".to_string(), 3);
    assert_eq(intent_5_char.request_data().base_amount(), 24);
    assert_eq(intent_5_char.request_data().years(), 3);

    // Clean up
    destroy(intent_3_char);
    destroy(intent_5_char);
    destroy(iota_names);
    destroy(clock);
}

#[test, expected_failure(abort_code = ::iota_names::payment::ECannotExceedMaxYears)]
fun test_init_registration_with_years_exceed_max() {
    let mut ctx = tx_context::dummy();
    let mut iota_names = setup_iota_names(&mut ctx);

    let name = b"test.iota".to_string();

    // Try to register for 6 years (max is 5)
    let _intent = payment::init_registration_with_years(&mut iota_names, name, 6);

    abort 1337
}

#[test]
fun test_e2e_multi_year_registration() {
    let mut ctx = tx_context::dummy();
    let mut iota_names = setup_iota_names(&mut ctx);
    let clock = clock::create_for_testing(&mut ctx);

    let name = b"test.iota".to_string();

    // Register for 3 years using the new function
    let intent = payment::init_registration_with_years(&mut iota_names, name, 3);
    assert_eq(intent.request_data().base_amount(), 120); // 100 + (10 * 2)
    assert_eq(intent.request_data().years(), 3);

    // Complete the payment
    let receipt = handle_payment(intent, &mut iota_names, &mut ctx);

    // Register the name
    let nft = receipt.register(&mut iota_names, &clock, &mut ctx);

    // Verify the NFT was created with correct details
    assert_eq(nft.name_str(), name);
    // Should expire in exactly 3 years
    assert_eq(nft.expiration_timestamp_ms(), constants::year_ms() * 3);

    // Clean up
    destroy(iota_names);
    destroy(nft);
    destroy(clock);
}

public fun setup_iota_names(ctx: &mut TxContext): IotaNames {
    let (mut iota_names, cap) = iota_names::new_for_testing(ctx);

    let renewal_config = pricing_config::new_renewal_config(
        test_pricing_config(true),
    );

    cap.add_config(&mut iota_names, test_pricing_config(false));
    // add a renewal config.
    cap.add_config(&mut iota_names, renewal_config);
    cap.add_config(&mut iota_names, core_config::default());

    // authorize a "payments" app that is responsible for handling payments and
    // issuing receipts.
    cap.authorize<PaymentsAuth>(&mut iota_names);

    test_init_utils::setup_for_testing(&mut iota_names, &cap, ctx);

    destroy(cap);
    iota_names
}

// handles the payment, and if successful (always in this e2e test), issues the receipt.
fun handle_payment(
    intent: PaymentIntent,
    iota_names: &mut IotaNames,
    ctx: &mut TxContext,
): Receipt {
    // the amount the user needs to pay.
    let amount = intent.request_data().base_amount();
    let coin = coin::mint_for_testing<IOTA>(amount, ctx);

    intent.finalize_payment(iota_names, PaymentsAuth {}, coin)
}

fun test_pricing_config(renewal: bool): PricingConfig {
    let ranges = vector[
        pricing_config::new_range(vector[3, 3]),
        pricing_config::new_range(vector[4, 4]),
        pricing_config::new_range(vector[5, 64]),
    ];

    let prices = if (renewal) {
        vector[50, 10, 2]
    } else {
        vector[500, 100, 20]
    };

    pricing_config::new(
        ranges,
        prices,
    )
}
