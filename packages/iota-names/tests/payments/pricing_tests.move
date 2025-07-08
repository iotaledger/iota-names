// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module iota_names::pricing_config_tests;

use iota_names::pricing_config;
use iota_names::name;

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

    assert!(pricing_config.pricing().get(&pricing_config::new_range(vector[1, 10])) == 10);
    assert!(pricing_config.pricing().get(&pricing_config::new_range(vector[11, 20])) == 20);
    assert!(pricing_config.pricing().get(&pricing_config::new_range(vector[21, 30])) == 30);
    assert!(pricing_config.pricing().get(&pricing_config::new_range(vector[31, 31])) == 45);

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
fun test_calculate_base_price_of_name() {
    let ranges = vector[
        pricing_config::new_range(vector[1, 10]),
        pricing_config::new_range(vector[11, 20]),
        pricing_config::new_range(vector[21, 21]),
    ];

    let pricing_config = pricing_config::new(
        ranges,
        vector[10, 20, 30],
    );

    let name_short = name::new(b"5char.iota".to_string());
    assert!(pricing_config.calculate_base_price_of_name(name_short) == 10);

    let name_medium = name::new(b"15char-----name.iota".to_string());
    assert!(pricing_config.calculate_base_price_of_name(name_medium) == 20);

    // Test boundary values
    let name_boundary_0 = name::new(b"1.iota".to_string());
    assert!(pricing_config.calculate_base_price_of_name(name_boundary_0) == 10);

    let name_boundary_1 = name::new(b"10charname.iota".to_string());
    assert!(pricing_config.calculate_base_price_of_name(name_boundary_1) == 10);

    let name_boundary_2 = name::new(b"11char-name.iota".to_string());
    assert!(pricing_config.calculate_base_price_of_name(name_boundary_2) == 20);

    let name_boundary_3 = name::new(b"21char-----------name.iota".to_string());
    assert!(pricing_config.calculate_base_price_of_name(name_boundary_3) == 30);
}

#[test, expected_failure(abort_code = ::iota_names::pricing_config::EPriceNotSet)]
fun test_calculate_base_price_if_name_price_not_set() {
    let ranges = vector[pricing_config::new_range(vector[1, 10])];
    let pricing = pricing_config::new(ranges, vector[10]);
    
    // Test name with length outside configured range
    let name_out_of_range = name::new(b"15-out-of-range.iota".to_string());
    pricing.calculate_base_price_of_name(name_out_of_range);
}

#[test]
fun test_is_between_inclusive() {
    let range = pricing_config::new_range(vector[1, 10]);

    assert!(range.is_between_inclusive(0) == false);
    assert!(range.is_between_inclusive(1) == true);
    assert!(range.is_between_inclusive(5) == true);
    assert!(range.is_between_inclusive(10) == true);
    assert!(range.is_between_inclusive(11) == false);
    assert!(range.is_between_inclusive(100) == false);
}
