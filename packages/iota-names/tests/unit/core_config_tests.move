// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module iota_names::core_config_tests;

use iota::{test_utils::assert_eq, vec_map};
use iota_names::{constants, core_config::{Self, CoreConfig}, domain};

#[test]
fun test_config_creation_and_field_access() {
    let config = core_config::new(
        3,
        63,
        constants::payments_version!(),
        1,
        vector[constants::iota_tld()],
        vec_map::empty(),
    );

    assert_eq(config.min_label_length(), 3);
    assert_eq(config.max_label_length(), 63);
    assert_eq(config.payments_version(), constants::payments_version!());
    assert!(config.is_valid_tld(&constants::iota_tld()));
}

#[test]
fun test_valid_domains() {
    let config = core_config::default();
    let mut domain = domain::new(b"iota-names.iota".to_string());
    config.assert_is_valid_for_sale(&domain);

    domain = domain::new(b"iota.iota".to_string());
    config.assert_is_valid_for_sale(&domain);
}

#[test]
fun custom_config_valid_length() {
    let config = core_config::new(
        1,
        63,
        constants::payments_version!(),
        5,
        vector[constants::iota_tld()],
        vec_map::empty(),
    );
    config.assert_is_valid_for_sale(&domain::new(b"0.iota".to_string()));
}

#[test, expected_failure(abort_code = core_config::EInvalidTld)]
fun test_invalid_tld() {
    core_config::default().assert_is_valid_for_sale(&domain::new(b"iota-names.move".to_string()));
}

#[test, expected_failure(abort_code = core_config::EInvalidLength)]
fun test_invalid_label_length() {
    core_config::default().assert_is_valid_for_sale(&domain::new(b"o.iota".to_string()));
}

#[test, expected_failure(abort_code = core_config::EInvalidLength)]
fun test_invalid_label_length_2() {
    custom_config(1, 5).assert_is_valid_for_sale(
        &domain::new(b"123456.iota".to_string()),
    );
}

#[test, expected_failure(abort_code = core_config::ESubnameNotSupported)]
fun test_subname_not_supported() {
    custom_config(1, 5).assert_is_valid_for_sale(
        &domain::new(b"inner.iota-names.iota".to_string()),
    );
}

fun custom_config(min: u8, max: u8): CoreConfig {
    core_config::new(
        min,
        max,
        constants::payments_version!(),
        5,
        vector[constants::iota_tld()],
        vec_map::empty(),
    )
}
