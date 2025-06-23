// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module iota_names::pricing_config_tests;

use iota_names::pricing_config;
use iota_names::domain;

#[test]
fun test_e2e() {
    let ranges = vector[
        pricing_config::new_range(vector[1, 10]),
        pricing_config::new_range(vector[11, 20]),
        pricing_config::new_range(vector[21, 30]),
        pricing_config::new_range(vector[31, 31]),
    ];

    let pricing_config = pricing_config::new(
        ranges,
        vector[10, 20, 30, 45],
    );

    // test internal values
    assert!(pricing_config.calculate_base_price(5) == 10);
    assert!(pricing_config.calculate_base_price(15) == 20);
    assert!(pricing_config.calculate_base_price(25) == 30);

    // test upper bounds
    assert!(pricing_config.calculate_base_price(10) == 10);
    assert!(pricing_config.calculate_base_price(20) == 20);
    assert!(pricing_config.calculate_base_price(30) == 30);

    // test lower bounds
    assert!(pricing_config.calculate_base_price(1) == 10);
    assert!(pricing_config.calculate_base_price(11) == 20);
    assert!(pricing_config.calculate_base_price(21) == 30);

    // single length pricing
    assert!(pricing_config.calculate_base_price(31) == 45);
}

#[test, expected_failure(abort_code = ::iota_names::pricing_config::EInvalidRange)]
fun test_range_overlap_1() {
    let ranges = vector[
        pricing_config::new_range(vector[1, 10]),
        pricing_config::new_range(vector[9, 20]),
    ];

    pricing_config::new(ranges, vector[10, 20]);
}

#[test, expected_failure(abort_code = ::iota_names::pricing_config::EInvalidRange)]
fun test_range_overlap_2() {
    let ranges = vector[
        pricing_config::new_range(vector[1, 10]),
        pricing_config::new_range(vector[10, 20]),
    ];

    pricing_config::new(ranges, vector[10, 20]);
}

#[test, expected_failure(abort_code = ::iota_names::pricing_config::EInvalidRange)]
fun test_range_overlap_3() {
    let ranges = vector[
        pricing_config::new_range(vector[1, 10]),
        pricing_config::new_range(vector[21, 30]),
        pricing_config::new_range(vector[11, 20]),
    ];

    pricing_config::new(ranges, vector[10, 20, 30]);
}

#[test, expected_failure(abort_code = ::iota_names::pricing_config::EInvalidRange)]
fun test_range_overlap_4() {
    let ranges = vector[
        pricing_config::new_range(vector[20, 30]),
        pricing_config::new_range(vector[30, 40]),
        pricing_config::new_range(vector[40, 50]),
    ];

    pricing_config::new(ranges, vector[10, 20, 30]);
}

#[test, expected_failure(abort_code = ::iota_names::pricing_config::ELengthMismatch)]
fun test_length_mismatch() {
    let ranges = vector[pricing_config::new_range(vector[10, 20])];

    pricing_config::new(ranges, vector[10, 20]);
}

#[test, expected_failure(abort_code = ::iota_names::pricing_config::EInvalidLength)]
fun test_range_construction_too_long() {
    pricing_config::new_range(vector[10, 20, 30]);
}

#[test, expected_failure(abort_code = ::iota_names::pricing_config::EInvalidRange)]
fun test_invalid_range_construction() {
    pricing_config::new_range(vector[20, 10]);
}

#[test, expected_failure(abort_code = ::iota_names::pricing_config::EPriceNotSet)]
fun test_price_not_set() {
    let ranges = vector[pricing_config::new_range(vector[1, 10])];

    let pricing = pricing_config::new(ranges, vector[10]);

    pricing.calculate_base_price(20);
}

#[test]
fun test_calculate_base_price_of_domain() {
    let ranges = vector[
        pricing_config::new_range(vector[1, 10]),
        pricing_config::new_range(vector[11, 20]),
        pricing_config::new_range(vector[21, 21]),
    ];

    let pricing_config = pricing_config::new(
        ranges,
        vector[10, 20, 30],
    );

    let domain_short = domain::new(b"5char.iota".to_string());
    assert!(pricing_config.calculate_base_price_of_domain(domain_short) == 10);

    let domain_medium = domain::new(b"15char-----name.iota".to_string());
    assert!(pricing_config.calculate_base_price_of_domain(domain_medium) == 20);

    // Test boundary values
    let domain_boundary_0 = domain::new(b"1.iota".to_string());
    assert!(pricing_config.calculate_base_price_of_domain(domain_boundary_0) == 10);

    let domain_boundary_1 = domain::new(b"10charname.iota".to_string());
    assert!(pricing_config.calculate_base_price_of_domain(domain_boundary_1) == 10);

    let domain_boundary_2 = domain::new(b"11char-name.iota".to_string());
    assert!(pricing_config.calculate_base_price_of_domain(domain_boundary_2) == 20);

    let domain_boundary_3 = domain::new(b"21char-----------name.iota".to_string());
    assert!(pricing_config.calculate_base_price_of_domain(domain_boundary_3) == 30);
}

#[test, expected_failure(abort_code = ::iota_names::pricing_config::EPriceNotSet)]
fun test_calculate_base_price_of_domain_price_not_set() {
    let ranges = vector[pricing_config::new_range(vector[1, 10])];
    let pricing = pricing_config::new(ranges, vector[10]);
    
    // Test domain with length outside configured range
    let domain_out_of_range = domain::new(b"15-out-of-range.iota".to_string());
    pricing.calculate_base_price_of_domain(domain_out_of_range);
}
